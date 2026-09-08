---
name: monchos-bar-pos-context
description: Contexto operativo para modificar Demo Bar v1.0, un POS React/Supabase con roles, turnos e integración offline.
---

# Contexto del proyecto: Moncho's Bar / Zorix POS

Usa este documento antes de cambiar funcionalidades de este repositorio. Describe la arquitectura y los invariantes que no deben romperse; no sustituye la inspección del código implicado.

## Propósito y tecnología

Aplicación web/PWA de punto de venta para un bar. Permite a meseros abrir cuentas y tomar pedidos; a caja cobrar y cerrar turnos; y a administración mantener catálogo, inventario, usuarios, gastos y reportes.

- Frontend: React 19 con JSX, Vite 8 y React Router 7.
- Estilos: Tailwind CSS 4 y componentes con `lucide-react` / `react-icons`.
- Persistencia y tiempo real: Supabase (`@supabase/supabase-js`).
- PWA: `vite-plugin-pwa`, con actualización automática y caché de recursos estáticos; las peticiones a Supabase usan `NetworkOnly`.
- Despliegue: Vercel; `vercel.json` redirige rutas al `index.html`.
- No hay TypeScript ni suite de pruebas configurada. La verificación base es `npm run lint` y `npm run build`.

Las variables requeridas son `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. No se deben añadir valores ni secretos al repositorio.

## Punto de entrada y navegación

- `src/main.jsx`: monta `App` dentro de `StrictMode`.
- `src/App.jsx`: envuelve toda la aplicación en `BarProvider` y define rutas:
  - `/login`
  - `/mesero`: roles `mesero` y `admin`
  - `/cajero`: roles `cajero` y `admin`
  - `/admin`: solo `admin`
- `src/components/common/ProtectedRoute.jsx` controla las rutas privadas. La sesión es local por pestaña en `sessionStorage`, clave `bar_active_session_v1`; no usa Supabase Auth.

Las vistas principales son `TableGrid` (mesero), `CashierView` y `AdminView`. Caja usa las pestañas `active` y `dashboard`; administración usa `dashboard`, `history`, `expenses`, `profitloss`, `catalog`, `inventory` y `users`.

## Fuente de verdad y modelo de estado

`src/context/BarContext.jsx` es la capa central de dominio. Los componentes consumen `useBar()` y no deben acceder directamente a Supabase para operaciones de negocio. Al ampliar un flujo, añade o adapta la acción del contexto y exponla desde el provider.

El contexto carga, transforma y mantiene:

- `users`, `categories`, `products`, `tables`
- `paidInvoices`, `cashRegisterHistory`, `expenses`
- `exchangeRate`, `currentShiftId`, `shiftStartTime`
- `currentUser`, conectividad (`isOnline`) y tamaño de cola (`pendingSyncCount`)

Formas relevantes en UI:

- Producto: `{ id, name, category, price, cost, stock, image, bundleItems? }`.
  - `stock: null` implica que no se controla stock, normalmente comida.
  - `bundleItems` contiene `{ productId, quantity }` y representa una promoción que descuenta productos base.
- Mesa/cuenta: `{ id, name, status, customerName, assignedWaiterId, assignedWaiterName, createdAt, isBar, items, unprintedItems }`.
  - Cada item es `{ product, quantity }`.
  - Estados activos: `ocupada` y `pendiente_pago`. Las mesas cobradas/canceladas desaparecen de la lista activa.
- Factura local: usa camelCase (`shiftId`, `tableName`, `paymentMethod`); la base usa snake_case. Conserva el mapeo explícito en `fetchData` y `payInvoice`.

## Tablas Supabase y convenciones

El cliente se crea en `src/supabaseClient.js`. Las tablas usadas son:

- `settings`: `key`, `value` (incluye `exchange_rate`).
- `users`: `name`, `username`, `password_hash`, `role`, `is_active`.
- `categories`: `id`, `name`, `icon`.
- `products`: `id`, `name`, `category_id`, `price`, `cost`, `stock`, `icon_path`.
- `product_bundles`: `promotion_id`, `base_product_id`, `quantity_to_deduct`.
- `tables`: `id`, `name`, `status`, `customer_name`, `assigned_waiter_id`, `created_at`, `is_bar_account`.
- `orders`: `table_id`, `product_id`, `quantity`, `is_printed`.
- `invoices` e `invoice_items`.
- `shifts`: apertura/cierre y totales.
- `expenses`: gastos asociados al turno.

Las imágenes de productos remotos se suben al bucket `products`, ruta `product_images/`. Las imágenes locales de respaldo se resuelven desde `src/mock/initialData.js` mediante nombre del producto.

## Flujos críticos e invariantes

### Mesas y pedidos

- `openTable` y `addBarAccount` crean IDs temporales (`mesa_<timestamp>` y `barra_<timestamp>`) y actualizan la UI antes de escribir en Supabase.
- `updateTableOrder` es la única actualización normal de pedido. Conserva su actualización optimista, debounce de 200 ms y escritura serializada por mesa (`latestPendingWriteRef` e `inFlightWritesRef`). No reemplaces estos mecanismos por escrituras concurrentes.
- `unprintedItems` representa los ítems de comanda aún no impresos; `clearUnprintedItems` marca sus órdenes como impresas.
- `sendOrderToCashier` cambia una mesa a `pendiente_pago`. No debe modificar ítems ni liberar mesa.

### Pago, stock y turnos

- `payInvoice` crea primero una factura y sus líneas, descuenta inventario y elimina mesa/órdenes. La UI se actualiza de forma optimista.
- El pago con `Tarjeta` añade un 10 % al total; los demás métodos usan el total base.
- Productos de categoría `comida` no descuentan stock. Promociones descuentan `bundleItems`; existen reglas heredadas por nombre para cubetazos y cigarros. Al editar esta lógica, prioriza representar nuevos paquetes con `product_bundles` en lugar de introducir más coincidencias por nombre.
- `closeShift` cierra el turno actual, intenta cerrar turnos huérfanos, reasigna facturas locales sin turno y abre uno nuevo. No cambies este flujo sin verificar su efecto sobre facturas y reportes.
- `src/utils/printShiftReceipt.js` genera el Corte Z desde facturas, catálogo y categorías; si se cambia el modelo de factura o promociones, revisa también ese reporte.

### Modo offline y sincronización

`src/utils/offlineQueue.js` guarda en `localStorage` la cola `bar_offline_queue_v1` y el snapshot `bar_offline_snapshot_v2`. Las acciones admitidas actualmente son `CREATE_INVOICE`, `UPDATE_ORDER`, `CANCEL_ORDER` y `CREATE_EXPENSE`.

- Ante un error de red, las acciones de negocio deben conservar la actualización local y encolarse con datos suficientes para reintentarse.
- No afirmes que una acción se sincronizó hasta que `syncOfflineQueue` la complete.
- `BarContext` protege contra respuestas remotas desactualizadas con `pendingSyncTablesRef`: 5 minutos offline y 2 segundos online. Mantén este escudo cuando alteres mesas, pedidos, cobros o borrados.
- Hay realtime de Supabase y un refresco de respaldo cada 8 segundos. Los cambios al estado local deben tolerar recargas concurrentes.

## Archivos a consultar según la tarea

- Operación de mesas y comandas: `src/components/waiter/` y `BarContext.jsx`.
- Cobro y cierre: `src/components/cashier/`, `BarContext.jsx`, `utils/printShiftReceipt.js`.
- Catálogo, inventario, usuarios, gastos y reportes: `src/components/admin/` y `BarContext.jsx`.
- Datos iniciales e imágenes: `src/mock/initialData.js`, `src/assets/Imagenes/`.
- Semilla manual de Supabase: `seed.js`. Solo ejecutarla cuando se solicite explícitamente, ya que modifica datos remotos.
- `src/context/BarContext_backup.jsx` es una referencia antigua local; no la uses como implementación activa salvo que se pida recuperar o comparar comportamiento.

## Convenciones de cambio

- Mantén el idioma español de la interfaz y el estilo visual existente (slate/amarillo, diseño responsive).
- Mantén `number` para importes y cantidades al transformar datos de Supabase; evita concatenación de strings en totales.
- Conserva la separación entre campos de BD en snake_case y campos de UI en camelCase.
- Cualquier cambio de datos debe contemplar tanto la ruta online como la offline, incluida la cola cuando aplique.
- Evita borrar una mesa o pedido sin actualizar el escudo local, pues un fetch/realtime tardío puede revivirlo visualmente.
- Después de cambios de código, ejecuta `npm run lint` y `npm run build`; informa las limitaciones si la configuración existente impide una verificación.
