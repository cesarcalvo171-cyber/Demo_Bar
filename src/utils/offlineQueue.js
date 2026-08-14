// src/utils/offlineQueue.js
// Motor de Cola Offline y Sincronización Local-First para Zorix POS / Moncho's Bar

const QUEUE_KEY = 'bar_offline_queue_v1';
const SNAPSHOT_KEY = 'bar_offline_snapshot_v1';

/**
 * Obtener la cola de operaciones pendientes desde localStorage
 */
export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error al leer la cola offline:', err);
    return [];
  }
};

/**
 * Guardar una nueva operación en la cola offline
 * @param {string} type - Tipo de operación: 'CREATE_INVOICE' | 'UPDATE_ORDER' | 'CANCEL_ORDER' | 'CREATE_EXPENSE' | 'UPDATE_STOCK'
 * @param {object} payload - Datos de la operación
 */
export const enqueueOfflineAction = (type, payload) => {
  try {
    const queue = getOfflineQueue();
    const actionItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(actionItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`📦 Acción encolada para modo offline [${type}]:`, actionItem);
    return actionItem;
  } catch (err) {
    console.error('Error al guardar en cola offline:', err);
    return null;
  }
};

/**
 * Remover un elemento procesado de la cola
 */
export const removeOfflineAction = (actionId) => {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter(item => item.id !== actionId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error al remover de la cola offline:', err);
  }
};

/**
 * Guardar un snapshot local del catálogo y mesas para uso 100% offline
 */
export const saveOfflineSnapshot = (data) => {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error al guardar snapshot offline:', err);
  }
};

/**
 * Obtener el snapshot local del catálogo y mesas
 */
export const getOfflineSnapshot = () => {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error al leer snapshot offline:', err);
    return null;
  }
};

/**
 * Procesar y sincronizar todas las acciones pendientes con Supabase
 * @param {object} supabase - Cliente de Supabase
 * @param {function} onComplete - Callback al terminar la sincronización
 */
export const syncOfflineQueue = async (supabase, onComplete) => {
  if (!navigator.onLine) {
    console.log('📶 Aún sin conexión a internet. La sincronización se reintentará al reconectar.');
    return { synced: 0, remaining: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  console.log(`🔄 Iniciando sincronización de ${queue.length} acciones pendientes con Supabase...`);
  let syncedCount = 0;

  for (const item of queue) {
    try {
      let success = false;

      switch (item.type) {
        case 'CREATE_INVOICE': {
          const { invoice, invoiceItems, stockDeductions, tableInfo } = item.payload;
          
          // 1. Insertar factura
          const { error: invErr } = await supabase.from('invoices').insert(invoice);
          if (invErr) {
            console.error('Error sincronizando factura:', invErr);
            break;
          }

          // 2. Insertar items de factura
          if (invoiceItems && invoiceItems.length > 0) {
            await supabase.from('invoice_items').insert(invoiceItems);
          }

          // 3. Aplicar descuento de stock
          if (stockDeductions && stockDeductions.length > 0) {
            for (const deduct of stockDeductions) {
              const { data: prod } = await supabase
                .from('products')
                .select('stock')
                .eq('id', deduct.productId)
                .single();
              if (prod && prod.stock !== null) {
                const newStock = Math.max(0, prod.stock - deduct.quantity);
                await supabase.from('products').update({ stock: newStock }).eq('id', deduct.productId);
              }
            }
          }

          // 4. Liberar mesa
          if (tableInfo) {
            if (tableInfo.isBar) {
              await supabase.from('tables').delete().eq('id', String(tableInfo.id));
            } else {
              await supabase.from('tables').update({
                status: 'libre',
                customer_name: null,
                assigned_waiter_id: null,
                created_at: null,
              }).eq('id', String(tableInfo.id));
            }
            await supabase.from('orders').delete().eq('table_id', String(tableInfo.id));
          }

          success = true;
          break;
        }

        case 'UPDATE_ORDER': {
          const { tableId, items, isBar, customerName, waiterId } = item.payload;
          const sTableId = String(tableId);

          // Actualizar mesa
          if (isBar) {
            await supabase.from('tables').upsert({
              id: sTableId,
              name: `Barra ${sTableId.slice(-4)}`,
              status: 'ocupada',
              customer_name: customerName,
              assigned_waiter_id: waiterId,
              is_bar_account: true,
            });
          } else {
            await supabase.from('tables').update({
              status: 'ocupada',
              customer_name: customerName,
              assigned_waiter_id: waiterId,
            }).eq('id', sTableId);
          }

          // Reemplazar pedidos
          await supabase.from('orders').delete().eq('table_id', sTableId);
          if (items && items.length > 0) {
            const ordersToInsert = items.map(it => ({
              table_id: sTableId,
              product_id: it.product.id,
              quantity: it.quantity,
              is_printed: true,
            }));
            await supabase.from('orders').insert(ordersToInsert);
          }

          success = true;
          break;
        }

        case 'CANCEL_ORDER': {
          const { tableId, isBar } = item.payload;
          const sTableId = String(tableId);
          await supabase.from('orders').delete().eq('table_id', sTableId);
          if (isBar) {
            await supabase.from('tables').delete().eq('id', sTableId);
          } else {
            await supabase.from('tables').update({
              status: 'libre',
              customer_name: null,
              assigned_waiter_id: null,
              created_at: null,
            }).eq('id', sTableId);
          }
          success = true;
          break;
        }

        case 'CREATE_EXPENSE': {
          const { expense } = item.payload;
          const { error: expErr } = await supabase.from('expenses').insert(expense);
          if (!expErr) success = true;
          break;
        }

        default:
          console.warn(`Tipo de acción desconocido en cola offline: ${item.type}`);
          success = true; // Descartar para no bloquear la cola
          break;
      }

      if (success) {
        removeOfflineAction(item.id);
        syncedCount++;
        console.log(`✅ Acción sincronizada exitosamente con Supabase [${item.type}]`);
      }
    } catch (itemErr) {
      console.error(`Error procesando acción ${item.id}:`, itemErr);
    }
  }

  const remaining = getOfflineQueue().length;
  console.log(`🎉 Sincronización completada: ${syncedCount} enviadas, ${remaining} pendientes.`);

  if (onComplete && typeof onComplete === 'function') {
    onComplete({ synced: syncedCount, remaining });
  }

  return { synced: syncedCount, remaining };
};
