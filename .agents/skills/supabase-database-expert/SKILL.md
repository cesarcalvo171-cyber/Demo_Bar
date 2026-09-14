---
name: supabase-database-expert
description: Guía y referencia exhaustiva para interactuar y administrar la base de datos Supabase de Monchos_Bars (Zorix POS). Documenta el esquema de PostgreSQL, tablas, relaciones foráneas, 11 índices B-Tree, función RPC transaccional save_table_order, configuración de timeouts de conexión, buenas prácticas de PostgREST y protocolos de infraestructura.
---

# Supabase Database Expert — Monchos_Bars (Zorix POS)

Esta skill define el rol de asistente especializado en la base de datos PostgreSQL alojada en **Supabase** para el proyecto **Monchos_Bars**. Contiene la documentación técnica completa del esquema, relaciones, funciones RPC, índices, reglas de consumo y diagnóstico de infraestructura.

---

## 1. Información General del Proyecto y Entorno

* **Project ID:** `cmqpulttacvxzeipsnot`
* **Nombre:** `Monchos_Bars`
* **Región:** `us-east-1` (North Virginia)
* **Instancia:** `t3.nano` (Plan Free de Supabase / AWS)
* **Motor de Base de Datos:** PostgreSQL 15+ administrado por Supabase
* **Protocolos de Acceso:** 
  * API REST / PostgREST (`https://cmqpulttacvxzeipsnot.supabase.co/rest/v1/`)
  * SDK JavaScript / TypeScript (`@supabase/supabase-js`)
  * Conexión directa / Pooler (Puerto 5432 / 6543)
* **Variables de Entorno Clave:**
  * `VITE_SUPABASE_URL`: Endpoint de la API
  * `VITE_SUPABASE_ANON_KEY`: Llave pública para el cliente web

---

## 2. Esquema Completo de Tablas y Relaciones

```mermaid
erDiagram
    users ||--o{ shifts : "abre / cierra"
    users ||--o{ tables : "asignado como mesero"
    categories ||--o{ products : "categoriza"
    products ||--o{ product_bundles : "promoción / base"
    products ||--o{ orders : "producto pedido"
    tables ||--o{ orders : "contiene comandas"
    shifts ||--o{ invoices : "agrupa ventas"
    shifts ||--o{ expenses : "agrupa gastos"
    invoices ||--o{ invoice_items : "líneas de venta"
```

### 2.1. `users` (Usuarios y Autenticación de Turno)
Gestiona el personal con acceso al sistema (cajeros, meseros, administradores).
* `id` (`uuid`, PK): Identificador único (autogenerado con `gen_random_uuid()`).
* `name` (`text`): Nombre legible del empleado (ej. "Juan Pérez").
* `username` (`text`, Unique): Usuario de acceso.
* `password_hash` (`text`): Contraseña cifrada o PIN.
* `role` (`text`): Rol de acceso (`admin`, `cajero`, `mesero`).
* `is_active` (`boolean`, default `true`): Estado de activación del usuario.

### 2.2. `categories` (Categorías de Productos)
* `id` (`text`, PK): Código de categoría (ej. `cervezas`, `licores`, `comida`, `bebidas`, `cigarros`).
* `name` (`text`): Nombre para mostrar en el catálogo.
* `icon` (`text`, nullable): Nombre del icono de Lucide/React Icons.

### 2.3. `products` (Catálogo e Inventario)
* `id` (`uuid`, PK): ID del producto.
* `name` (`text`): Nombre comercial (ej. `TOÑA 12 ONZA`, `ALITAS DE 6`).
* `category_id` (`text`, FK -> `categories.id`): Categoría a la que pertenece.
* `price` (`numeric(10,2)`): Precio de venta al público en Córdobas (C$).
* `cost` (`numeric(10,2)`, default `0`): Costo unitario de compra para cálculo de utilidades.
* `stock` (`integer`, nullable): Cantidad disponible en almacén.
  * *Regla:* Si es `null`, es un producto sin control de inventario físico (ej. comida preparada, combos dinámicos).
* `icon_path` (`text`, nullable): URL de la imagen en Supabase Storage (bucket `products/product_images/`).
* `is_active` (`boolean`, default `true`): Visibilidad en el menú.

### 2.4. `product_bundles` (Combos y Promociones)
Define qué productos base se deben descontar del inventario al vender una promoción (ej. Un *Cubetazo* descuenta 6 cervezas).
* `id` (`uuid` / `serial`, PK): Identificador del registro.
* `promotion_id` (`uuid`, FK -> `products.id`): El producto tipo combo que se cobra.
* `base_product_id` (`uuid`, FK -> `products.id`): El producto individual que se descuenta.
* `quantity_to_deduct` (`numeric`): Cuántas unidades del producto base se deben restar.

### 2.5. `tables` (Mesas y Cuentas Activas en Tiempo Real)
Representa las cuentas abiertas actualmente en el salón o barra.
* `id` (`text`, PK): Identificador de la mesa. Convención:
  * Mesas de salón: `mesa_<timestamp>` (ej. `mesa_1789326117411`).
  * Cuentas de barra: `barra_<timestamp>` (ej. `barra_1789326048343`).
* `name` (`text`): Nombre visual asignado (ej. `Mesa 3`, `Barra`).
* `status` (`text`): Estado operativo: `libre`, `ocupada`, `pendiente_pago`.
  * *Regla:* Al cobrarse o cancelarse una mesa, se elimina de `tables` para mantener la tabla pequeña y de alta velocidad.
* `customer_name` (`text`): Nombre o descripción del cliente asignado.
* `assigned_waiter_id` (`uuid`, FK -> `users.id`, nullable): Mesero que atiende.
* `created_at` (`timestamptz`): Fecha y hora de apertura.
* `is_bar_account` (`boolean`, default `false`): Diferencia si es barra o mesa física.
* `order_version` (`bigint`, default `0`): Versión secuencial de control de concurrencia optimista (evita sobreescrituras entre meseros concurrentes).

### 2.6. `orders` (Comandas y Productos por Mesa)
* `id` (`bigint` / `uuid`, PK): Identificador del ítem en comanda.
* `table_id` (`text`, FK -> `tables.id` con `ON DELETE CASCADE`): Mesa a la que pertenece.
* `product_id` (`uuid`, FK -> `products.id`): Producto ordenado.
* `quantity` (`numeric`): Cantidad ordenada.
* `is_printed` (`boolean`, default `false`): Si ya se envió a la comanda física de cocina/barra.

### 2.7. `shifts` (Turnos y Cortes de Caja)
* `id` (`uuid`, PK): Identificador único del turno.
* `opened_at` (`timestamptz`, default `now()`): Inicio del turno.
* `closed_at` (`timestamptz`, nullable): Fin del turno (`null` = turno actualmente abierto).
* `opened_by` (`uuid`, FK -> `users.id`): Cajero que inició turno.
* `closed_by` (`uuid`, FK -> `users.id`, nullable): Cajero que cerró el turno.
* `total_expected` (`numeric(12,2)`, nullable): Ventas calculadas automáticamente por el sistema.
* `total_real` (`numeric(12,2)`, nullable): Monto real entregado en caja física.
* `difference` (`numeric(12,2)`, nullable): Faltante o sobrante (`total_real - total_expected`).

### 2.8. `invoices` (Facturas Históricas y Cobros)
* `id` (`text`, PK): Número de factura con prefijo `FAC-<timestamp>` (ej. `FAC-1789342497050`).
* `shift_id` (`uuid`, FK -> `shifts.id`): Turno en el que se realizó la venta.
* `table_name` (`text`): Nombre de la mesa o barra cobrada.
* `customer_name` (`text`): Cliente al que se le facturó.
* `waiter_name` (`text`): Nombre del mesero que atendió.
* `total` (`numeric(10,2)`): Total final pagado.
* `payment_method` (`text`): Forma de pago (`Efectivo`, `Tarjeta`, `Transferencia`).
  * *Regla:* Pagos con `Tarjeta` aplican un 10% adicional.
* `transaction_id` (`text`, nullable): Código de referencia de tarjeta/transferencia.
* `created_at` (`timestamptz`, default `now()`): Fecha y hora exacta de emisión.

### 2.9. `invoice_items` (Detalle de Productos Facturados)
* `id` (`uuid`, PK): ID de la línea de factura.
* `invoice_id` (`text`, FK -> `invoices.id` con `ON DELETE CASCADE`): Factura padre.
* `product_name` (`text`): Nombre congelado del producto al momento de venta.
* `quantity` (`numeric`): Cantidad cobrada.
* `price_at_sale` (`numeric(10,2)`): Precio unitario en el momento de la venta.
* `cost_at_sale` (`numeric(10,2)`): Costo unitario en el momento de la venta (para reporte de ganancias brutas).

### 2.10. `expenses` (Egresos y Gastos de Turno)
* `id` (`uuid`, PK): Identificador del gasto.
* `shift_id` (`uuid`, FK -> `shifts.id`): Turno que asume el egreso de caja.
* `amount` (`numeric(10,2)`): Monto en córdobas del gasto.
* `description` (`text`): Concepto o motivo (ej. "Hielo", "Limpieza", "Pago proveedor").
* `category` (`text`): Categoría del gasto (`compras`, `servicios`, `mantenimiento`, `otros`).
* `is_paid` (`boolean`, default `true`): Si ya se desembolsó de la caja.
* `notification_date` (`date`, nullable): Para pagos programados a futuro.
* `created_at` (`timestamptz`, default `now()`): Fecha de registro.

### 2.11. `settings` (Parámetros Globales)
* `key` (`text`, PK): Clave del parámetro (ej. `exchange_rate`).
* `value` (`text`): Valor almacenado (ej. `"36.80"`).

---

## 3. Índices de Rendimiento B-Tree Creados

Para erradicar escaneos completos (*Sequential Scans*) y evitar saturaciones de CPU en la micro-instancia `t3.nano`, la base de datos cuenta con 11 índices de cobertura sobre todas sus claves foráneas:

```sql
CREATE INDEX idx_orders_table_id ON public.orders (table_id);
CREATE INDEX idx_orders_product_id ON public.orders (product_id);
CREATE INDEX idx_invoices_shift_id ON public.invoices (shift_id);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);
CREATE INDEX idx_expenses_shift_id ON public.expenses (shift_id);
CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_tables_assigned_waiter_id ON public.tables (assigned_waiter_id);
CREATE INDEX idx_product_bundles_promotion_id ON public.product_bundles (promotion_id);
CREATE INDEX idx_product_bundles_base_product_id ON public.product_bundles (base_product_id);
CREATE INDEX idx_shifts_opened_by ON public.shifts (opened_by);
CREATE INDEX idx_shifts_closed_by ON public.shifts (closed_by);
```

---

## 4. Función RPC Transaccional: `save_table_order`

La función nuclear del sistema para guardar comandas concurrentes es `public.save_table_order`. Fue diseñada con **control de concurrencia optimista** y retorno seguro ante conflictos para evitar bloqueos de conexiones y bucles infinitos:

```sql
CREATE OR REPLACE FUNCTION public.save_table_order(
  p_table_id text,
  p_expected_version bigint,
  p_table jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
declare
  v_table public.tables%rowtype;
begin
  -- 1. Asegurar que la fila de la mesa exista
  insert into public.tables (
    id, name, status, customer_name, assigned_waiter_id, created_at,
    is_bar_account, order_version
  ) values (
    p_table_id,
    coalesce(p_table->>'name', 'Mesa'),
    coalesce(p_table->>'status', 'ocupada'),
    coalesce(p_table->>'customer_name', ''),
    nullif(p_table->>'assigned_waiter_id', '')::uuid,
    coalesce(nullif(p_table->>'created_at', '')::timestamptz, now()),
    coalesce((p_table->>'is_bar_account')::boolean, false),
    0
  ) on conflict (id) do nothing;

  -- 2. Bloqueo exclusivo para evitar carreras entre meseros concurrentes
  select * into v_table
  from public.tables
  where id = p_table_id
  for update;

  -- 3. Verificación de versión (Concurrencia Optimista)
  if p_expected_version is null or v_table.order_version <> p_expected_version then
    -- Devuelve respuesta controlada sin abortar transacción para no colgar el pooler
    return jsonb_build_object(
      'order_version', v_table.order_version,
      'conflict', true,
      'message', format('Expected version %s but current version is %s', p_expected_version, v_table.order_version)
    );
  end if;

  -- 4. Actualizar metadata de mesa e incrementar versión
  update public.tables
  set name = coalesce(p_table->>'name', v_table.name),
      status = coalesce(p_table->>'status', v_table.status),
      customer_name = coalesce(p_table->>'customer_name', v_table.customer_name),
      assigned_waiter_id = coalesce(nullif(p_table->>'assigned_waiter_id', '')::uuid, v_table.assigned_waiter_id),
      is_bar_account = coalesce((p_table->>'is_bar_account')::boolean, v_table.is_bar_account),
      order_version = v_table.order_version + 1
  where id = p_table_id;

  -- 5. Reemplazar comandas de la mesa atómicamente
  delete from public.orders where table_id = p_table_id;

  insert into public.orders (table_id, product_id, quantity, is_printed)
  select
    p_table_id,
    (item->>'product_id')::uuid,
    (item->>'quantity')::numeric,
    coalesce((item->>'is_printed')::boolean, true)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  return jsonb_build_object('order_version', v_table.order_version + 1);
end;
$$;
```

---

## 5. Parámetros Críticos de Configuración de PostgreSQL

Para evitar que transacciones abortadas o conexiones huérfanas congelen el pool de conexiones de PostgREST (`PGRST003: Timed out acquiring connection from connection pool`), PostgreSQL tiene configurado:

```sql
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '20000';
ALTER ROLE authenticator SET idle_in_transaction_session_timeout = '20000';
```
* **Efecto:** Cualquier sesión que quede en estado `idle in transaction` o `idle in transaction (aborted)` por más de 20 segundos es terminada automáticamente por el servidor, liberando los candados y devolviendo el slot al pool.

---

## 6. Buenas Prácticas para Consultas SQL y Consumo PostgREST

1. **Filtrar siempre por `shift_id`:** Las tablas `invoices` y `expenses` acumulan miles de registros en el tiempo. Nunca hagas un `select * from invoices` sin acotarlo al turno activo o a un rango de fechas.
2. **Evitar sondeos en bucle (*polling*):** No utilices `setInterval` cortos (como 5s u 8s) para leer tablas completas. Confía en las suscripciones Realtime de Supabase con debouncing (500 ms) y en el evento `window.onfocus`.
3. **Manejo de Zona Horaria:** PostgreSQL almacena en `timestamptz` (UTC). Para consultas de turnos y cortes de Nicaragua, recuerda que Nicaragua opera en **UTC-6**. Un día calendario local abarca desde las 06:00 UTC de ese día hasta las 06:00 UTC del día siguiente.
4. **Descuento de Stock Atómico:** El inventario se descuenta **únicamente cuando se cobra la factura** (`payInvoice`), nunca en la comanda provisional. Al cobrar combos o cubetazos, se leen sus componentes desde `product_bundles` para deducir las botellas unitarias correspondientes.

---

## 7. Protocolo de Diagnóstico de Infraestructura

Si el panel de Supabase reporta alertas de CPU al 100% o disco agotado (`DatabaseStorageCapacityExhausted`):
1. **Revisar conexiones activas:**
   ```sql
   SELECT pid, usename, state, now() - state_change as duration, left(query, 100)
   FROM pg_stat_activity
   WHERE datname = 'postgres' AND state != 'idle';
   ```
2. **Purgar WAL y buffers tras tormentas masivas:**
   * Ejecutar **Restart Project -> Fast reboot** desde *Project Settings -> General*.
   * Supabase ejecutará un `CHECKPOINT` automático como superusuario, reciclando los segmentos de `pg_wal` y limpiando archivos temporales de disco.
