import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { INITIAL_PRODUCTS, INITIAL_TABLES } from '../mock/initialData';

const BarContext = createContext();
const SESSION_KEY = 'bar_active_session_v1';

const imageDictionary = INITIAL_PRODUCTS.reduce((acc, p) => {
  acc[p.name] = p.image;
  return acc;
}, {});

export const BarProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  
  const [currentRole, setCurrentRole] = useState(currentUser?.role || 'mesero');
  
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [products, setProducts] = useState([]);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(36.62);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [shiftStartTime, setShiftStartTime] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch Global Configs
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const rate = settingsData.find(s => s.key === 'exchange_rate');
        if (rate) setExchangeRate(rate.value);
      }

      // Fetch Users
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) {
        setUsers(usersData.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          password: u.password_hash,
          role: u.role,
          active: u.is_active
        })));
      }

      // Fetch Products
      const { data: productsData } = await supabase.from('products').select('*');
      const { data: bundlesData } = await supabase.from('product_bundles').select('*');
      if (productsData) {
        const mappedProducts = productsData.map(p => {
          const bundleItems = bundlesData?.filter(b => b.promotion_id === p.id).map(b => ({
            productId: b.base_product_id,
            quantity: b.quantity_to_deduct
          }));
          return {
            id: p.id,
            name: p.name,
            category: p.category_id,
            price: Number(p.price),
            cost: Number(p.cost),
            stock: p.stock !== null ? Number(p.stock) : null,
            image: p.icon_path || imageDictionary[p.name] || '',
            bundleItems: bundleItems?.length > 0 ? bundleItems : undefined
          };
        });
        setProducts(mappedProducts);
      }

      // Fetch Tables & Orders
      const { data: tablesData } = await supabase.from('tables').select('*');
      const { data: ordersData } = await supabase.from('orders').select('*');
      
      if (tablesData && productsData) {
        // Assemble initial tables array with their orders
        let newTables = INITIAL_TABLES.map(initTable => {
          const dbTable = tablesData.find(t => t.id === initTable.id);
          if (!dbTable) return initTable;
          
          const tableOrders = ordersData?.filter(o => o.table_id === dbTable.id) || [];
          
          return {
            ...initTable,
            status: dbTable.status,
            customerName: dbTable.customer_name || '',
            assignedWaiterId: dbTable.assigned_waiter_id,
            createdAt: dbTable.created_at,
            items: tableOrders.map(o => {
              const pData = productsData.find(p => p.id === o.product_id);
              return {
                product: {
                  id: pData?.id,
                  name: pData?.name,
                  price: Number(pData?.price || 0),
                  cost: Number(pData?.cost || 0),
                  category: pData?.category_id
                },
                quantity: o.quantity
              };
            }),
            unprintedItems: tableOrders.filter(o => !o.is_printed).map(o => {
              const pData = productsData.find(p => p.id === o.product_id);
              return {
                product: { id: pData?.id, name: pData?.name },
                quantity: o.quantity
              };
            })
          };
        });

        // Add dynamically created bar accounts
        const barAccounts = tablesData.filter(t => t.is_bar_account);
        for (const barAcc of barAccounts) {
          const tableOrders = ordersData?.filter(o => o.table_id === barAcc.id) || [];
          newTables.push({
            id: barAcc.id,
            name: barAcc.name,
            status: barAcc.status,
            customerName: barAcc.customer_name || '',
            assignedWaiterId: barAcc.assigned_waiter_id,
            createdAt: barAcc.created_at,
            isBar: true,
            items: tableOrders.map(o => {
              const pData = productsData.find(p => p.id === o.product_id);
              return {
                product: {
                  id: pData?.id, name: pData?.name, price: Number(pData?.price || 0), cost: Number(pData?.cost || 0), category: pData?.category_id
                },
                quantity: o.quantity
              };
            }),
            unprintedItems: tableOrders.filter(o => !o.is_printed).map(o => {
              const pData = productsData.find(p => p.id === o.product_id);
              return { product: { id: pData?.id, name: pData?.name }, quantity: o.quantity };
            })
          });
        }
        setTables(newTables);
      }

      // Fetch Shifts & Financials
      const { data: shiftsData } = await supabase.from('shifts').select('*').order('opened_at', { ascending: false });
      if (shiftsData && shiftsData.length > 0) {
        const activeShift = shiftsData.find(s => !s.closed_at);
        if (activeShift) {
          setCurrentShiftId(activeShift.id);
          setShiftStartTime(activeShift.opened_at);
        }

        // Fetch all invoices
        const { data: invData } = await supabase.from('invoices').select('*');
        const { data: invItemsData } = await supabase.from('invoice_items').select('*');
        
        const allMappedInvoices = (invData || []).map(inv => {
          const items = (invItemsData || []).filter(i => i.invoice_id === inv.id).map(i => ({
            name: i.product_name, quantity: i.quantity, price: Number(i.price_at_sale), cost: Number(i.cost_at_sale)
          }));
          return {
            id: inv.id,
            shiftId: inv.shift_id,
            tableName: inv.table_name,
            customerName: inv.customer_name,
            waiterName: inv.waiter_name,
            total: Number(inv.total),
            paymentMethod: inv.payment_method,
            transactionId: inv.transaction_id,
            fullDate: inv.created_at,
            date: new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items
          };
        });

        // Current shift invoices
        setPaidInvoices(allMappedInvoices.filter(i => i.shiftId === (activeShift ? activeShift.id : null)));

        // History logic
        const closedShifts = shiftsData.filter(s => s.closed_at);
        setCashRegisterHistory(closedShifts.map(cs => ({
          id: cs.id,
          startTime: cs.opened_at,
          endTime: cs.closed_at,
          totalSales: Number(cs.total_real || cs.total_expected),
          totalCash: allMappedInvoices.filter(i => i.shiftId === cs.id && i.paymentMethod === 'Efectivo').reduce((s, i) => s + i.total, 0),
          totalCard: allMappedInvoices.filter(i => i.shiftId === cs.id && i.paymentMethod !== 'Efectivo').reduce((s, i) => s + i.total, 0),
          invoices: allMappedInvoices.filter(i => i.shiftId === cs.id)
        })));
      }

      // Fetch expenses
      const { data: expData } = await supabase.from('expenses').select('*');
      if (expData) {
        setExpenses(expData.map(e => ({
          id: e.id,
          description: e.description,
          category: e.category,
          amount: Number(e.amount),
          isPaid: e.is_paid,
          notificationDate: e.notification_date,
          date: e.created_at
        })));
      }

    } catch (err) {
      console.error("Error inicializando Supabase Data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    let timeoutId;
    const handleRealtimeChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchData();
      }, 500); // Debounce de 500ms para evitar múltiples peticiones
    };

    // Setup Realtime for Tables and Orders
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleRealtimeChange)
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTableOrder = async (tableId, items, customerName = '', unprintedItems = null) => {
    try {
      const isOccupied = items.length > 0;

      // OPTIMISTIC UI UPDATE
      setTables(prevTables => prevTables.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status: isOccupied ? 'ocupada' : 'libre',
            customerName: customerName,
            assignedWaiterId: currentUser?.id,
            items: items,
            unprintedItems: unprintedItems || []
          };
        }
        return t;
      }));

      const { error: e1 } = await supabase.from('tables').upsert({
        id: tableId,
        name: tables.find(t => t.id === tableId)?.name || tableId,
        status: isOccupied ? 'ocupada' : 'libre',
        customer_name: customerName,
        assigned_waiter_id: currentUser?.id,
        created_at: isOccupied ? new Date().toISOString() : null
      }, { onConflict: 'id' });
      if (e1) {
        console.error("Error upserting table:", e1);
        window.alert("Error guardando mesa: " + e1.message);
      }

      const { error: e2 } = await supabase.from('orders').delete().eq('table_id', tableId);
      if (e2) {
        console.error("Error deleting old orders:", e2);
        window.alert("Error borrando pedidos viejos: " + e2.message);
      }
      
      if (isOccupied) {
        const ordersToInsert = items.map(i => ({
          table_id: tableId,
          product_id: i.product.id,
          quantity: i.quantity,
          is_printed: unprintedItems ? !unprintedItems.find(u => u.product.id === i.product.id) : true
        }));
        const { error: e3 } = await supabase.from('orders').insert(ordersToInsert);
        if (e3) {
          console.error("Error inserting orders:", e3);
          window.alert("Error insertando nuevos pedidos: " + e3.message);
        }
      }
    } catch (err) {
      console.error("updateTableOrder crash:", err);
      window.alert("Crash al guardar pedido: " + err.message);
    }
  };

  const clearUnprintedItems = async (tableId) => {
    try {
      // OPTIMISTIC UI UPDATE
      setTables(prevTables => prevTables.map(t => {
        if (t.id === tableId) {
          return { ...t, unprintedItems: [] };
        }
        return t;
      }));
      await supabase.from('orders').update({ is_printed: true }).eq('table_id', tableId);
    } catch (err) {
      console.error("Error clearing unprinted items:", err);
    }
  };

  const addBarAccount = async (customerName) => {
    try {
      const newBarId = `barra_${Date.now()}`;
      
      // OPTIMISTIC UI UPDATE
      setTables(prev => [...prev, {
        id: newBarId,
        name: 'Barra',
        status: 'ocupada',
        customerName: customerName,
        assignedWaiterId: currentUser?.id,
        createdAt: new Date().toISOString(),
        isBar: true,
        items: [],
        unprintedItems: []
      }]);

      const { error } = await supabase.from('tables').insert({
        id: newBarId,
        name: 'Barra',
        status: 'ocupada',
        is_bar_account: true,
        customer_name: customerName,
        assigned_waiter_id: currentUser?.id,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.error("Error creating bar account:", error);
        window.alert("Error creando cuenta en barra: " + error.message);
      }
      return newBarId;
    } catch (err) {
      window.alert("Crash al crear cuenta en barra: " + err.message);
    }
  };

  const sendOrderToCashier = async (tableId, customerName) => {
    // OPTIMISTIC UI
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, status: 'pendiente_pago', customerName } : t
    ));

    await supabase.from('tables').update({
      status: 'pendiente_pago',
      customer_name: customerName
    }).eq('id', tableId);
  };

  const payInvoice = async (tableId, paymentMethod, transactionId = '') => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.items.length === 0) return;

    // OPTIMISTIC UI
    if (table.isBar) {
      setTables(prev => prev.filter(t => t.id !== tableId));
    } else {
      setTables(prev => prev.map(t => 
        t.id === tableId ? { 
          ...t, status: 'libre', customerName: '', assignedWaiterId: null, createdAt: null, items: [], unprintedItems: [] 
        } : t
      ));
    }

    const total = table.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const invoiceId = `FAC-${Date.now()}`;

    // 1. Insert Invoice
    await supabase.from('invoices').insert({
      id: invoiceId,
      shift_id: currentShiftId,
      table_name: table.name,
      customer_name: table.customerName || 'Cliente',
      waiter_name: currentUser?.name || 'Mesero',
      total,
      payment_method: paymentMethod,
      transaction_id: transactionId
    });

    // 2. Insert Invoice Items
    const itemsToInsert = table.items.map(i => ({
      invoice_id: invoiceId,
      product_name: i.product.name,
      quantity: i.quantity,
      price_at_sale: i.product.price,
      cost_at_sale: i.product.cost || 0
    }));
    await supabase.from('invoice_items').insert(itemsToInsert);

    // 3. Subtract Stock (using rpc or direct read/write)
    // For simplicity, we loop products locally and update
    for (const item of table.items) {
      if (item.product.category !== 'comida') {
        const prod = products.find(p => p.id === item.product.id);
        if (prod && prod.stock !== null) {
          await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', prod.id);
        }
      }
    }

    // 4. Free table and delete orders
    if (table.isBar) {
      await supabase.from('tables').delete().eq('id', tableId);
    } else {
      await supabase.from('tables').update({
        status: 'libre', customer_name: null, assigned_waiter_id: null, created_at: null
      }).eq('id', tableId);
    }
    await supabase.from('orders').delete().eq('table_id', tableId);
  };

  const closeShift = async () => {
    if (!currentShiftId) return;
    const shiftTotal = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    await supabase.from('shifts').update({
      closed_at: new Date().toISOString(),
      closed_by: currentUser?.id,
      total_real: shiftTotal, // Simplified
      total_expected: shiftTotal
    }).eq('id', currentShiftId);

    // Open new shift
    const { data: newShift } = await supabase.from('shifts').insert({
      opened_by: currentUser?.id
    }).select().single();
    
    if (newShift) {
      setCurrentShiftId(newShift.id);
      setShiftStartTime(newShift.opened_at);
    }
    fetchData();
  };

  const cancelTableOrder = async (tableId) => {
    await supabase.from('orders').delete().eq('table_id', tableId);
    const table = tables.find(t => t.id === tableId);
    if (table?.isBar) {
      await supabase.from('tables').delete().eq('id', tableId);
    } else {
      await supabase.from('tables').update({ status: 'libre', customer_name: null }).eq('id', tableId);
    }
    fetchData();
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addProduct = async (newProd, imageFile) => {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { error } = await supabase.from('products').insert({
      name: newProd.name, category_id: newProd.category, price: newProd.price, cost: newProd.cost, stock: newProd.stock, icon_path: imageUrl
    });
    if (error) console.error("Error inserting product:", error);
    
    fetchData();
  };

  const updateProduct = async (updatedProd, imageFile) => {
    let imageUrl = updatedProd.image; // Keep existing
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { error } = await supabase.from('products').update({
      name: updatedProd.name, category_id: updatedProd.category, price: updatedProd.price, cost: updatedProd.cost, stock: updatedProd.stock, icon_path: imageUrl
    }).eq('id', updatedProd.id);
    if (error) console.error("Error updating product:", error);

    fetchData();
  };

  const deleteProduct = async (productId) => {
    await supabase.from('products').delete().eq('id', productId);
    fetchData();
  };

  const updateStock = async (productId, newStock) => {
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    fetchData();
  };

  const addUser = async (newUser) => {
    await supabase.from('users').insert({
      name: newUser.name, username: newUser.username, password_hash: newUser.password || '1234', role: newUser.role, is_active: true
    });
    fetchData();
  };

  const updateUser = async (updatedUser) => {
    await supabase.from('users').update({
      name: updatedUser.name, username: updatedUser.username, password_hash: updatedUser.password, role: updatedUser.role, is_active: updatedUser.active
    }).eq('id', updatedUser.id);
    fetchData();
  };

  const deleteUser = async (userId) => {
    await supabase.from('users').delete().eq('id', userId);
    fetchData();
  };

  const updateExchangeRate = async (newRate) => {
    await supabase.from('settings').upsert({ key: 'exchange_rate', value: newRate }, { onConflict: 'key' });
    fetchData();
  };

  const addExpense = async (newExpense) => {
    await supabase.from('expenses').insert({
      shift_id: currentShiftId,
      description: newExpense.description,
      category: newExpense.category,
      amount: newExpense.amount,
      is_paid: newExpense.isPaid,
      notification_date: newExpense.notificationDate
    });
    fetchData();
  };

  const updateExpense = async (updatedExpense) => {
    await supabase.from('expenses').update({
      description: updatedExpense.description, category: updatedExpense.category, amount: updatedExpense.amount, is_paid: updatedExpense.isPaid, notification_date: updatedExpense.notificationDate
    }).eq('id', updatedExpense.id);
    fetchData();
  };

  const deleteExpense = async (expenseId) => {
    await supabase.from('expenses').delete().eq('id', expenseId);
    fetchData();
  };

  const login = (username, password) => {
    const targetName = username.trim().toLowerCase();
    const targetPass = password.trim();
    const foundUser = users.find(u => u.username?.toLowerCase() === targetName && u.password === targetPass);

    if (!foundUser) return { success: false, message: 'Usuario o contraseña incorrectos.' };
    if (!foundUser.active) return { success: false, message: 'Este usuario se encuentra inactivo.' };

    const sessionData = { id: foundUser.id, name: foundUser.name, username: foundUser.username, role: foundUser.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setCurrentRole(foundUser.role);
    return { success: true, user: sessionData };
  };

  const loginMesero = (pin) => {
    const targetPass = pin.trim();
    const foundUser = users.find(u => u.role === 'mesero' && u.password === targetPass);

    if (!foundUser) return { success: false, message: 'PIN incorrecto o mesero no encontrado.' };
    if (!foundUser.active) return { success: false, message: 'Este usuario se encuentra inactivo.' };

    const sessionData = { id: foundUser.id, name: foundUser.name, username: foundUser.username, role: foundUser.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setCurrentRole(foundUser.role);
    return { success: true, user: sessionData };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  // Check if initial shift is missing and create it
  useEffect(() => {
    if (!isLoading && !currentShiftId && currentUser) {
      supabase.from('shifts').insert({ opened_by: currentUser.id }).select().single().then(({ data }) => {
        if (data) {
          setCurrentShiftId(data.id);
          setShiftStartTime(data.opened_at);
        }
      });
    }
  }, [isLoading, currentShiftId, currentUser]);

  if (isLoading && !products.length) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 font-bold text-xl">Conectando al Servidor Principal...</div>;
  }

  return (
    <BarContext.Provider
      value={{
        currentUser, currentRole, setCurrentRole, users, tables, products, paidInvoices, shiftStartTime, cashRegisterHistory, exchangeRate, expenses,
        updateTableOrder, sendOrderToCashier, payInvoice, cancelTableOrder, clearUnprintedItems, addBarAccount, closeShift, addProduct, updateProduct, deleteProduct, updateStock,
        addUser, updateUser, deleteUser, updateExchangeRate, addExpense, updateExpense, deleteExpense, login, loginMesero, logout
      }}
    >
      {children}
    </BarContext.Provider>
  );
};

export const useBar = () => {
  const context = useContext(BarContext);
  if (!context) throw new Error('useBar debe usarse dentro de un BarProvider');
  return context;
};
