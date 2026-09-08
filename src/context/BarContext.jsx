import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { INITIAL_PRODUCTS, INITIAL_TABLES, CATEGORIES } from "../mock/initialData";
import { 
  getOfflineQueue, 
  enqueueOfflineAction, 
  syncOfflineQueue, 
  saveOfflineSnapshot, 
  getOfflineSnapshot 
} from "../utils/offlineQueue";

const BarContext = createContext();
const SESSION_KEY = "bar_active_session_v1";

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

  const [currentRole, setCurrentRole] = useState(currentUser?.role || "mesero");

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [products, setProducts] = useState([]);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(36.62);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [shiftStartTime, setShiftStartTime] = useState(null);

  // Estados de Conexión y Cola Offline
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getOfflineQueue().length);

  const [isLoading, setIsLoading] = useState(true);

  // Referencias para proteger el estado en tiempo real contra Race Conditions
  const pendingSyncTablesRef = useRef(new Map());
  const updateOrderDebounceTimersRef = useRef(new Map());
  const inFlightWritesRef = useRef(new Map());
  const latestPendingWriteRef = useRef(new Map());
  const fetchSeqRef = useRef(0);

  const fetchData = async (silent = false) => {
    const mySeq = ++fetchSeqRef.current;
    try {
      if (!silent) setIsLoading(true);

      // Fetch Global Configs
      const { data: settingsData } = await supabase.from("settings").select("*");
      if (mySeq !== fetchSeqRef.current) return;
      if (settingsData) {
        const rate = settingsData.find((s) => s.key === "exchange_rate");
        if (rate) setExchangeRate(rate.value);
      }

      // Fetch Categories from Supabase
      const { data: categoriesData } = await supabase.from("categories").select("*");
      if (mySeq !== fetchSeqRef.current) return;
      if (categoriesData && categoriesData.length > 0) {
        setCategories(
          categoriesData.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || "MdLocalOffer",
          }))
        );
      }

      // Fetch Users
      const { data: usersData } = await supabase.from("users").select("*");
      if (mySeq !== fetchSeqRef.current) return;
      if (usersData) {
        setUsers(
          usersData.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            password: u.password_hash,
            role: u.role,
            active: u.is_active,
          })),
        );
      }

      // Fetch Products
      const { data: productsData } = await supabase.from("products").select("*");
      const { data: bundlesData } = await supabase
        .from("product_bundles")
        .select("*");
      if (mySeq !== fetchSeqRef.current) return;

      let mappedProducts = [];
      let newTables = [];
      let currentShiftInvoices = [];
      let calculatedHistory = [];
      if (productsData) {
        mappedProducts = productsData.map((p) => {
          const bundleItems = bundlesData
            ?.filter((b) => b.promotion_id === p.id)
            .map((b) => ({
              productId: b.base_product_id,
              quantity: b.quantity_to_deduct,
            }));
          return {
            id: p.id,
            name: p.name,
            category: p.category_id,
            price: Number(p.price),
            cost: Number(p.cost),
            stock: p.stock !== null ? Number(p.stock) : null,
            image:
              p.icon_path && p.icon_path.startsWith("http")
                ? p.icon_path
                : imageDictionary[p.name] || "",
            bundleItems: bundleItems?.length > 0 ? bundleItems : undefined,
          };
        });
        setProducts(mappedProducts);
      }

      // Fetch Tables & Orders
      const { data: tablesData, error: tablesError } = await supabase.from("tables").select("*");
      const { data: ordersData, error: ordersError } = await supabase.from("orders").select("*");

      if (mySeq !== fetchSeqRef.current) return;
      if (tablesError) throw new Error("Fallo al obtener mesas: " + tablesError.message);
      if (ordersError) throw new Error("Fallo al obtener órdenes: " + ordersError.message);

      if (tablesData && productsData) {
        // Función auxiliar que resuelve los items de una mesa protegiendo contra race conditions
        const resolveTableItems = (tableId, dbTable, tableOrders) => {
          const sId = String(tableId);
          // El snapshot local es autoritativo hasta que su escritura atómica termina.
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          const shieldDuration = isOffline ? 300000 : 2000;

          const pending = pendingSyncTablesRef.current.get(sId);
          const hasPendingActive =
            pending &&
            !pending.isDeleted &&
            Date.now() - pending.timestamp < shieldDuration;

          const dbItemsMap = new Map();
          const dbUnprintedMap = new Map();

          tableOrders.forEach((order) => {
            const rawProd =
              productsData.find((p) => String(p.id) === String(order.product_id)) ||
              (INITIAL_PRODUCTS || []).find(
                (p) => String(p.id) === String(order.product_id),
              );

            const product = rawProd
              ? {
                  id: rawProd.id,
                  name: rawProd.name,
                  category: rawProd.category_id || rawProd.category,
                  price: Number(rawProd.price),
                  cost: Number(rawProd.cost || 0),
                  stock: rawProd.stock !== null ? Number(rawProd.stock) : null,
                  image:
                    rawProd.icon_path && rawProd.icon_path.startsWith("http")
                      ? rawProd.icon_path
                      : imageDictionary[rawProd.name] || "",
                }
              : {
                  id: order.product_id,
                  name: "Producto",
                  category: "general",
                  price: 0,
                  cost: 0,
                  stock: null,
                  image: "",
                };

            const sProdId = String(product.id);
            const qty = Number(order.quantity) || 1;

            if (dbItemsMap.has(sProdId)) {
              dbItemsMap.get(sProdId).quantity += qty;
            } else {
              dbItemsMap.set(sProdId, { product, quantity: qty });
            }

            if (!order.is_printed) {
              if (dbUnprintedMap.has(sProdId)) {
                dbUnprintedMap.get(sProdId).quantity += qty;
              } else {
                dbUnprintedMap.set(sProdId, { product, quantity: qty });
              }
            }
          });

          if (!hasPendingActive) {
            return {
              status: dbTable.status || "libre",
              customerName: dbTable.customer_name || "",
              items: Array.from(dbItemsMap.values()),
              unprintedItems: Array.from(dbUnprintedMap.values()),
            };
          }

          return {
            status: pending.status || dbTable.status || "ocupada",
            customerName: pending.customerName !== undefined ? pending.customerName : dbTable.customer_name || "",
            // No mezclar con la BD: una reducción a cero debe seguir siendo cero.
            items: pending.items || [],
            unprintedItems: pending.unprintedItems || [],
          };
        };

        // Assemble active tables from database
        newTables = [];
        for (const dbTable of tablesData) {
          const sId = String(dbTable.id);
          const pending = pendingSyncTablesRef.current.get(sId);
          if (pending && pending.isDeleted && Date.now() - pending.timestamp < 300000) {
            continue; // Ignorar mesas que fueron cobradas o canceladas localmente
          }

          const tableOrders =
            ordersData?.filter(
              (o) => String(o.table_id) === sId,
            ) || [];

          const resolved = resolveTableItems(sId, dbTable, tableOrders);

          // Si la mesa está en estado libre y no tiene items ni pending activo, no la mostramos como mesa activa
          if (resolved.status === "libre" && resolved.items.length === 0 && !pending) {
            continue;
          }

          newTables.push({
            id: sId,
            name: dbTable.name || (dbTable.is_bar_account ? "Barra" : `Mesa ${sId}`),
            status: resolved.status,
            customerName: resolved.customerName,
            assignedWaiterId: dbTable.assigned_waiter_id,
            assignedWaiterName: usersData?.find(u => u.id === dbTable.assigned_waiter_id)?.name,
            createdAt: dbTable.created_at,
            isBar: Boolean(dbTable.is_bar_account),
            orderVersion: Number(dbTable.order_version || 0),
            items: resolved.items,
            unprintedItems: resolved.unprintedItems,
          });
        }

        // Incorporar mesas creadas en cola offline o pending
        for (const [pId, pData] of pendingSyncTablesRef.current.entries()) {
          if (!pData.isDeleted && !newTables.some((t) => String(t.id) === String(pId))) {
            newTables.push({
              id: pId,
              name: pData.name || (pId.startsWith("barra_") ? "Barra" : `Mesa ${pId}`),
              status: pData.status || "ocupada",
              customerName: pData.customerName || "",
              assignedWaiterId: currentUser?.id,
              assignedWaiterName: currentUser?.name,
              createdAt: new Date().toISOString(),
              isBar: pId.startsWith("barra_"),
              orderVersion: pData.orderVersion || 0,
              items: pData.items || [],
              unprintedItems: pData.unprintedItems || [],
            });
          }
        }

        // Ordenar mesas cronológicamente
        newTables.sort((a, b) => {
          if (a.isBar && !b.isBar) return 1;
          if (!a.isBar && b.isBar) return -1;
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });

        if (mySeq === fetchSeqRef.current) {
          setTables(newTables);
        }
      }

      // Fetch Invoices
      const { data: invData } = await supabase.from("invoices").select("*");
      const { data: invItemsData } = await supabase.from("invoice_items").select("*");
      if (mySeq !== fetchSeqRef.current) return;

      let allInvoices = [];
      if (invData) {
        allInvoices = invData.map((inv) => ({
          id: inv.id,
          shiftId: inv.shift_id,
          tableName: inv.table_name,
          customerName: inv.customer_name,
          waiterName: inv.waiter_name,
          total: Number(inv.total),
          paymentMethod: inv.payment_method,
          transactionId: inv.transaction_id,
          fullDate: inv.created_at,
          date: new Date(inv.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          items:
            invItemsData
              ?.filter((it) => it.invoice_id === inv.id)
              .map((it) => ({
                name: it.product_name,
                quantity: it.quantity,
                price: Number(it.price_at_sale),
                cost: Number(it.cost_at_sale || 0),
              })) || [],
        }));
      }

      // Fetch Shifts
      const { data: shiftsData } = await supabase.from("shifts").select("*");
      if (mySeq !== fetchSeqRef.current) return;

      if (shiftsData) {
        const activeShift = shiftsData.find((s) => s.closed_at === null);
        if (activeShift) {
          setCurrentShiftId(activeShift.id);
          setShiftStartTime(activeShift.opened_at);
          currentShiftInvoices = allInvoices.filter(
            (inv) => inv.shiftId === activeShift.id,
          );
          setPaidInvoices(currentShiftInvoices);
        } else {
          setCurrentShiftId(null);
          setPaidInvoices([]);
        }

        const closedShifts = shiftsData.filter((s) => s.closed_at !== null);
        calculatedHistory = closedShifts.map((shift) => {
          const shiftInvoices = allInvoices.filter(
            (inv) => inv.shiftId === shift.id,
          );
          const totalSales = shiftInvoices.reduce(
            (sum, inv) => sum + inv.total,
            0,
          );
          const totalCash = shiftInvoices
            .filter((inv) => inv.paymentMethod === "Efectivo")
            .reduce((sum, inv) => sum + inv.total, 0);
          const totalCard = shiftInvoices
            .filter((inv) => inv.paymentMethod !== "Efectivo")
            .reduce((sum, inv) => sum + inv.total, 0);

          const cashier = usersData?.find((u) => u.id === shift.opened_by);

          return {
            id: shift.id,
            startTime: shift.opened_at,
            endTime: shift.closed_at,
            totalSales,
            totalCash,
            totalCard,
            cashierName: cashier ? cashier.name : "Cajero",
            invoices: shiftInvoices,
          };
        });

        setCashRegisterHistory(
          calculatedHistory.sort(
            (a, b) => new Date(b.endTime) - new Date(a.endTime),
          ),
        );
      }

      // Fetch Expenses
      const { data: expensesData } = await supabase.from("expenses").select("*");
      if (mySeq !== fetchSeqRef.current) return;

      if (expensesData) {
        setExpenses(
          expensesData.map((e) => ({
            id: e.id,
            amount: Number(e.amount),
            description: e.description,
            category: e.category,
            date: e.date,
          })),
        );
      }

      // Guardar snapshot para uso offline
      saveOfflineSnapshot({
        products: mappedProducts,
        tables: newTables,
        categories: categoriesData || CATEGORIES,
        users: usersData || [],
        paidInvoices: currentShiftInvoices,
        cashRegisterHistory: calculatedHistory,
      });

    } catch (err) {
      console.error("Error al cargar datos desde Supabase:", err);
      // Cargar desde snapshot si estamos offline
      if (!navigator.onLine) {
        const snapshot = getOfflineSnapshot();
        if (snapshot) {
          if (snapshot.products) setProducts(snapshot.products);
          if (snapshot.tables) setTables(snapshot.tables);
          if (snapshot.categories) setCategories(snapshot.categories);
          if (snapshot.users) setUsers(snapshot.users);
          if (snapshot.paidInvoices) setPaidInvoices(snapshot.paidInvoices);
          if (snapshot.cashRegisterHistory) setCashRegisterHistory(snapshot.cashRegisterHistory);
        }
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Sincronización en Tiempo Real
  useEffect(() => {
    fetchData();

    const triggerSync = () => {
      fetchData(true);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      console.log("📶 Conexión restablecida. Sincronizando cola offline...");
      const result = await syncOfflineQueue(supabase, () => {
        setPendingSyncCount(getOfflineQueue().length);
        fetchData(true);
      });
      setPendingSyncCount(result.remaining);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("📵 Conexión perdida. Operando en modo Offline.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 1. Supabase Realtime Channels
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        triggerSync,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        triggerSync,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        triggerSync,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        triggerSync,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        triggerSync,
      )
      .subscribe();

    // 2. Background sync fallback cada 8 segundos
    const syncInterval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        fetchData(true);
      }
    }, 8000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Función serializada que ejecuta la escritura a Supabase de forma atómica y ordenada
  const performTableWrite = async (sTableId) => {
    const dataToWrite = latestPendingWriteRef.current.get(sTableId);
    if (!dataToWrite) return;

    // Consumir el pending actual
    latestPendingWriteRef.current.delete(sTableId);

    const writePromise = (async () => {
      const {
        effectiveName,
        isOccupied,
        customerName,
        isBar,
        items,
        unprintedItems,
        targetTable,
        orderVersion,
        writeId,
      } = dataToWrite;

      try {
        if (!navigator.onLine) {
          throw new Error("Sin conexión a internet (detectado localmente)");
        }

        const orderItems = items.map((item) => ({
          product_id: String(item.product.id),
          quantity: item.quantity,
          is_printed: unprintedItems
            ? !unprintedItems.some(
                (unprinted) => String(unprinted.product.id) === String(item.product.id),
              )
            : true,
        }));
        const { data, error } = await supabase.rpc("save_table_order", {
          p_table_id: sTableId,
          p_expected_version: orderVersion,
          p_table: {
            name: effectiveName,
            status: isOccupied ? "ocupada" : "libre",
            customer_name: customerName,
            assigned_waiter_id: currentUser?.id || "",
            created_at: targetTable?.createdAt || new Date().toISOString(),
            is_bar_account: Boolean(isBar),
          },
          p_items: orderItems,
        });
        if (error) throw error;

        const confirmedVersion = Number(data?.order_version ?? orderVersion + 1);
        // A queued local edit must use the version that this transaction just created.
        const nextWrite = latestPendingWriteRef.current.get(sTableId);
        if (nextWrite) nextWrite.orderVersion = confirmedVersion;

        // Do not clear a newer local edit that arrived while this request ran.
        if (pendingSyncTablesRef.current.get(sTableId)?.writeId === writeId) {
          pendingSyncTablesRef.current.delete(sTableId);
        } else if (pendingSyncTablesRef.current.has(sTableId)) {
          pendingSyncTablesRef.current.get(sTableId).orderVersion = confirmedVersion;
        }
        setTables((prev) => prev.map((table) =>
          String(table.id) === sTableId
            ? { ...table, orderVersion: confirmedVersion }
            : table,
        ));
      } catch (dbErr) {
        if (dbErr?.code === "40001" || String(dbErr?.message).includes("TABLE_ORDER_CONFLICT")) {
          // Another device saved this table first. Never merge quantities automatically.
          pendingSyncTablesRef.current.delete(sTableId);
          console.warn("Conflicto de versión en mesa", sTableId);
          window.alert("Esta cuenta fue modificada desde otro dispositivo. Se cargará la versión más reciente antes de continuar.");
          fetchData(true);
          return;
        }

        if (!navigator.onLine || String(dbErr?.message).includes("Failed to fetch")) {
          console.warn("Database sync error (encolando offline):", dbErr.message || dbErr);
          enqueueOfflineAction("UPDATE_ORDER", {
            tableId: sTableId,
            tableName: effectiveName,
            items,
            unprintedItems,
            isBar,
            customerName,
            waiterId: currentUser?.id,
            createdAt: targetTable?.createdAt || new Date().toISOString(),
            expectedVersion: orderVersion,
          });
          setPendingSyncCount(getOfflineQueue().length);
          return;
        }

        // A server/configuration error must be visible; queuing it would replay an unsafe write forever.
        pendingSyncTablesRef.current.delete(sTableId);
        console.error("No se pudo guardar el pedido de forma segura:", dbErr);
        fetchData(true);
      }
    })();

    inFlightWritesRef.current.set(sTableId, writePromise);

    try {
      await writePromise;
    } finally {
      inFlightWritesRef.current.delete(sTableId);
      // Si mientras corríamos llegó una nueva versión pendiente, procesarla de inmediato
      if (latestPendingWriteRef.current.has(sTableId)) {
        performTableWrite(sTableId);
      }
    }
  };

  const updateTableOrder = async (
    tableId,
    items,
    customerName = "",
    unprintedItems = null,
    tableName = null,
  ) => {
    try {
      const isOccupied = items.length > 0;
      const sTableId = String(tableId);

      const targetTable = tables.find((t) => String(t.id) === sTableId);
      const effectiveName = tableName || targetTable?.name || `Mesa ${sTableId}`;
      const isBar = Boolean(targetTable?.isBar);
      const orderVersion = Number(targetTable?.orderVersion || 0);
      const writeId = `write_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // 1. Record in-flight pending state immediately to protect against background overwrites
      pendingSyncTablesRef.current.set(sTableId, {
        name: effectiveName,
        items,
        unprintedItems: unprintedItems || [],
        customerName,
        status: isOccupied ? "ocupada" : "libre",
        orderVersion,
        writeId,
        timestamp: Date.now(),
      });

      // 2. Guardar la versión más reciente en la cola de escritura serializada
      latestPendingWriteRef.current.set(sTableId, {
        effectiveName,
        isOccupied,
        customerName,
        isBar,
        items,
        unprintedItems,
        targetTable,
        orderVersion,
        writeId,
      });

      // 3. OPTIMISTIC UI UPDATE
      setTables((prevTables) =>
        prevTables.map((t) => {
          if (String(t.id) === sTableId) {
            return {
              ...t,
              name: effectiveName,
              status: isOccupied ? "ocupada" : "libre",
              customerName: customerName,
              assignedWaiterId: currentUser?.id,
              assignedWaiterName: currentUser?.name || t.assignedWaiterName,
              items: items,
              unprintedItems: unprintedItems || [],
              orderVersion,
            };
          }
          return t;
        }),
      );

      // 4. Debounced write to Supabase (200ms)
      if (updateOrderDebounceTimersRef.current.has(sTableId)) {
        clearTimeout(updateOrderDebounceTimersRef.current.get(sTableId));
      }

      const timerId = setTimeout(() => {
        // Solo disparar si no hay una escritura en curso para esta mesa
        if (!inFlightWritesRef.current.has(sTableId)) {
          performTableWrite(sTableId);
        }
      }, 200);

      updateOrderDebounceTimersRef.current.set(sTableId, timerId);
    } catch (err) {
      console.error("updateTableOrder crash:", err);
    }
  };

  const clearUnprintedItems = async (tableId) => {
    try {
      const sTableId = String(tableId);
      const table = tables.find((item) => String(item.id) === sTableId);
      if (!table) return;
      
      const currentShield = pendingSyncTablesRef.current.get(sTableId);
      if (currentShield) {
        pendingSyncTablesRef.current.set(sTableId, {
          ...currentShield,
          unprintedItems: [],
          timestamp: Date.now(),
        });
      }

      // OPTIMISTIC UI UPDATE
      setTables((prevTables) =>
        prevTables.map((t) => {
          if (String(t.id) === sTableId) {
            return { ...t, unprintedItems: [] };
          }
          return t;
        }),
      );
      // Printing changes the order snapshot too; save it through the same
      // versioned transaction instead of issuing an independent row update.
      updateTableOrder(sTableId, table.items, table.customerName, [], table.name);
    } catch (err) {
      console.error("Error clearing unprinted items:", err);
    }
  };

  const addBarAccount = async (customerName) => {
    try {
      const newBarId = `barra_${Date.now()}`;
      const clientName = customerName && customerName.trim() ? customerName.trim() : "Cliente Barra";

      pendingSyncTablesRef.current.set(newBarId, {
        name: "Barra",
        items: [],
        unprintedItems: [],
        customerName: clientName,
        status: "ocupada",
        orderVersion: 0,
        timestamp: Date.now(),
      });

      // OPTIMISTIC UI UPDATE
      setTables((prev) => [
        ...prev,
        {
          id: newBarId,
          name: "Barra",
          status: "ocupada",
          customerName: clientName,
          assignedWaiterId: currentUser?.id,
          assignedWaiterName: currentUser?.name,
          createdAt: new Date().toISOString(),
          isBar: true,
          orderVersion: 0,
          items: [],
          unprintedItems: [],
        },
      ]);

      const { error } = await supabase.from("tables").insert({
        id: newBarId,
        name: "Barra",
        status: "ocupada",
        is_bar_account: true,
        customer_name: clientName,
        assigned_waiter_id: currentUser?.id,
        created_at: new Date().toISOString(),
      });
      if (error) {
        if (!navigator.onLine || error.message?.includes("Failed to fetch")) {
          console.warn("📵 Creación de cuenta barra en modo offline. Se sincronizará al agregar productos.");
        } else {
          console.error("Error creating bar account:", error);
          window.alert("Error creando cuenta en barra: " + error.message);
        }
      }
      return newBarId;
    } catch (err) {
      if (!navigator.onLine || err.message?.includes("Failed to fetch")) {
        console.warn("📵 Crash offline ignorado al crear barra.");
      } else {
        window.alert("Crash al crear cuenta en barra: " + err.message);
      }
    }
  };

  // Función para abrir una mesa con número de mesa y cliente dinámicos
  const openTable = async ({ tableNumber, customerName }) => {
    try {
      const cleanInput = String(tableNumber || '').trim();
      const tableName = cleanInput.toLowerCase().startsWith('mesa') || isNaN(cleanInput)
        ? cleanInput
        : `Mesa ${cleanInput}`;
      
      const newTableId = `mesa_${Date.now()}`;
      const clientName = customerName ? customerName.trim() : "";

      pendingSyncTablesRef.current.set(newTableId, {
        name: tableName || "Mesa",
        items: [],
        unprintedItems: [],
        customerName: clientName,
        status: "ocupada",
        orderVersion: 0,
        timestamp: Date.now(),
      });

      const newTableObj = {
        id: newTableId,
        name: tableName || "Mesa",
        status: "ocupada",
        customerName: clientName,
        assignedWaiterId: currentUser?.id,
        assignedWaiterName: currentUser?.name,
        createdAt: new Date().toISOString(),
        isBar: false,
        orderVersion: 0,
        items: [],
        unprintedItems: [],
      };

      // OPTIMISTIC UI UPDATE
      setTables((prev) => [...prev, newTableObj]);

      const { error } = await supabase.from("tables").insert({
        id: newTableId,
        name: tableName || "Mesa",
        status: "ocupada",
        is_bar_account: false,
        customer_name: clientName,
        assigned_waiter_id: currentUser?.id,
        created_at: new Date().toISOString(),
      });

      if (error) {
        if (!navigator.onLine || error.message?.includes("Failed to fetch")) {
          console.warn("📵 Creación de mesa offline. Se sincronizará al agregar productos.");
        } else {
          console.error("Error creating table in Supabase:", error);
        }
      }
      return newTableId;
    } catch (err) {
      console.error("Crash al abrir mesa:", err);
      return null;
    }
  };

  const addNewTable = async () => {
    // Compatibilidad: abre una mesa solicitando los datos
    const num = prompt("Ingresa el número de mesa:");
    if (!num) return null;
    const client = prompt("Ingresa el nombre del cliente (opcional):") || "";
    return await openTable({ tableNumber: num, customerName: client });
  };

  // Función para eliminar mesas creadas dinámicamente
  const deleteTable = async (tableId) => {
    try {
      const sTableId = String(tableId);
      await supabase.from("orders").delete().eq("table_id", sTableId);
      const { error } = await supabase.from("tables").delete().eq("id", sTableId);
      if (error) {
        console.error("Error deleting table:", error);
        alert("Error eliminando mesa: " + error.message);
        return;
      }
      setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));

      // Proteger que no vuelva a aparecer en el próximo fetchData
      pendingSyncTablesRef.current.set(sTableId, {
        isDeleted: true,
        timestamp: Date.now(),
      });

      await fetchData(true);
    } catch (err) {
      console.error("Error al eliminar mesa:", err);
      alert("Error al eliminar la mesa: " + err.message);
    }
  };

  const sendOrderToCashier = async (tableId, customerName) => {
    const sTableId = String(tableId);

    const currentShield = pendingSyncTablesRef.current.get(sTableId);
    if (currentShield) {
      pendingSyncTablesRef.current.set(sTableId, {
        ...currentShield,
        status: "pendiente_pago",
        customerName,
        timestamp: Date.now(),
      });
    }

    // OPTIMISTIC UI
    setTables((prev) =>
      prev.map((t) =>
        String(t.id) === sTableId
          ? { ...t, status: "pendiente_pago", customerName }
          : t,
      ),
    );

    await supabase
      .from("tables")
      .update({
        status: "pendiente_pago",
        customer_name: customerName,
      })
      .eq("id", sTableId);
  };

  const payInvoice = async (tableId, paymentMethod, transactionId = "") => {
    const sTableId = String(tableId);
    
    // IMPORTANTE: Actualizar el escudo a estado "libre" y vacío, en lugar de borrarlo.
    // Así, cuando vuelva el internet, la mesa no parpadeará como "ocupada" mientras la cola se sincroniza.
    const table = tables.find((t) => String(t.id) === sTableId);
    if (!table || table.items.length === 0) return;

    pendingSyncTablesRef.current.set(sTableId, {
      items: [],
      unprintedItems: [],
      customerName: "",
      status: "libre",
      isDeleted: true, // Las mesas cobradas desaparecen por completo de la vista activa
      timestamp: Date.now(),
    });

    setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));

    const baseTotal = table.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const total = paymentMethod === 'Tarjeta' ? baseTotal * 1.10 : baseTotal;
    const invoiceId = `FAC-${Date.now()}`;

    // Calcular deducciones de stock (promociones y productos individuales)
    const stockDeductions = [];
    for (const item of table.items) {
      if (item.product.category !== "comida") {
        const prod = products.find(
          (p) => String(p.id) === String(item.product.id)
        ) || (INITIAL_PRODUCTS || []).find(
          (p) => p.name?.trim().toLowerCase() === item.product.name?.trim().toLowerCase()
        );

        if (prod && prod.bundleItems && Array.isArray(prod.bundleItems) && prod.bundleItems.length > 0) {
          for (const bundle of prod.bundleItems) {
            const qtyToSubtract = Number(bundle.quantity || 1) * Number(item.quantity || 1);
            stockDeductions.push({ productId: bundle.productId, quantity: qtyToSubtract });
          }
        } else if (prod && (prod.name?.toLowerCase().includes("cubetazo toña") || prod.name?.toLowerCase().includes("cubetazo tona"))) {
          const tonaProd = products.find(p => p.name?.toLowerCase().includes("toña 12") || p.name?.toLowerCase().includes("tona 12"));
          if (tonaProd) stockDeductions.push({ productId: tonaProd.id, quantity: 6 * Number(item.quantity || 1) });
        } else if (prod && prod.name?.toLowerCase().includes("cubetazo clasica")) {
          const clasicaProd = products.find(p => p.name?.toLowerCase().includes("clasica 12"));
          if (clasicaProd) stockDeductions.push({ productId: clasicaProd.id, quantity: 6 * Number(item.quantity || 1) });
        } else if (prod && (prod.name?.toLowerCase().includes("moder sabor caja") || prod.name?.toLowerCase().includes("modern sabor caja") || prod.name?.toLowerCase() === "moder caja")) {
          const moderSaborProd = products.find(p => p.name?.toLowerCase().includes("moder de sabor") || p.name?.toLowerCase().includes("modern de sabor"));
          if (moderSaborProd) stockDeductions.push({ productId: moderSaborProd.id, quantity: 20 * Number(item.quantity || 1) });
        } else if (prod && prod.name?.toLowerCase().includes("moder medio")) {
          const moderProd = products.find(p => p.name?.toLowerCase().includes("moder de sabor") || p.name?.toLowerCase().includes("cigarro modern"));
          if (moderProd) stockDeductions.push({ productId: moderProd.id, quantity: 10 * Number(item.quantity || 1) });
        } else if (prod && prod.name?.toLowerCase().includes("cigarro caja")) {
          const cigarroProd = products.find(p => p.name?.toLowerCase().includes("cigarro unidad"));
          if (cigarroProd) stockDeductions.push({ productId: cigarroProd.id, quantity: 20 * Number(item.quantity || 1) });
        } else if (prod && prod.name?.toLowerCase().includes("cigarro media caja")) {
          const cigarroProd = products.find(p => p.name?.toLowerCase().includes("cigarro unidad"));
          if (cigarroProd) stockDeductions.push({ productId: cigarroProd.id, quantity: 10 * Number(item.quantity || 1) });
        } else if (prod && prod.stock !== null) {
          stockDeductions.push({ productId: prod.id, quantity: Number(item.quantity || 1) });
        }
      }
    }

    const invoicePayload = {
      id: invoiceId,
      shift_id: currentShiftId,
      table_name: table.name,
      customer_name: table.customerName || "Cliente",
      waiter_name: currentUser?.name || "Mesero",
      total,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      created_at: new Date().toISOString(),
    };

    const invoiceItemsPayload = table.items.map((i) => ({
      invoice_id: invoiceId,
      product_name: i.product.name,
      quantity: i.quantity,
      price_at_sale: i.product.price,
      cost_at_sale: i.product.cost || 0,
    }));

    // OPTIMISTIC LOCAL STATE UPDATE (La pantalla no se traba jamás)
    if (table.isBar) {
      setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));
    } else {
      setTables((prev) =>
        prev.map((t) =>
          String(t.id) === sTableId
            ? {
                ...t,
                status: "libre",
                customerName: "",
                assignedWaiterId: null,
                createdAt: null,
                items: [],
                unprintedItems: [],
              }
            : t,
        ),
      );
    }

    // Descontar stock localmente en React
    if (stockDeductions.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const deduction = stockDeductions.find((d) => String(d.productId) === String(p.id));
          if (deduction && p.stock !== null) {
            return { ...p, stock: Math.max(0, p.stock - deduction.quantity) };
          }
          return p;
        })
      );
    }

    // Agregar factura a las facturas pagadas locales inmediatamente
    const newLocalInvoice = {
      id: invoiceId,
      shiftId: currentShiftId,
      tableName: table.name,
      customerName: table.customerName || "Cliente",
      waiterName: currentUser?.name || "Mesero",
      total,
      paymentMethod,
      transactionId,
      fullDate: invoicePayload.created_at,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: table.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.product.price),
        cost: Number(i.product.cost || 0),
        category: i.product.category,
      })),
    };
    setPaidInvoices((prev) => [...prev, newLocalInvoice]);

    // Enviar a Supabase o Encolar en Cola Offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn("📵 Sin conexión: Encolando cobro de factura en cola offline...");
      enqueueOfflineAction('CREATE_INVOICE', {
        invoice: invoicePayload,
        invoiceItems: invoiceItemsPayload,
        stockDeductions,
        tableInfo: { id: sTableId, isBar: table.isBar }
      });
      setPendingSyncCount(getOfflineQueue().length);
      return;
    }

    try {
      // 1. Insert Invoice
      await supabase.from("invoices").insert(invoicePayload);

      // 2. Insert Invoice Items
      await supabase.from("invoice_items").insert(invoiceItemsPayload);

      // 3. Subtract Stock
      for (const deduct of stockDeductions) {
        const { data: baseProd } = await supabase.from('products').select('stock').eq('id', deduct.productId).single();
        if (baseProd && baseProd.stock !== null) {
          const newStock = Math.max(0, baseProd.stock - deduct.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', deduct.productId);
        }
      }

      // 4. Free table and delete orders
      await supabase.from("tables").delete().eq("id", sTableId);
      await supabase.from("orders").delete().eq("table_id", sTableId);

      fetchData(true);
    } catch (err) {
      console.error("Error al enviar factura a Supabase, encolando offline:", err);
      enqueueOfflineAction('CREATE_INVOICE', {
        invoice: invoicePayload,
        invoiceItems: invoiceItemsPayload,
        stockDeductions,
        tableInfo: { id: sTableId, isBar: Boolean(table?.isBar) }
      });
      setPendingSyncCount(getOfflineQueue().length);
    }
  };

  const closeShift = async () => {
    if (!currentShiftId && paidInvoices.length === 0) return;
    const shiftTotal = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const closeTimestamp = new Date().toISOString();

    try {
      // 1. Cerrar el turno actual
      if (currentShiftId) {
        await supabase
          .from("shifts")
          .update({
            closed_at: closeTimestamp,
            closed_by: currentUser?.id,
            total_real: shiftTotal,
            total_expected: shiftTotal,
          })
          .eq("id", currentShiftId);
      }

      // 2. Cerrar preventivamente cualquier otro turno huérfano que haya quedado sin cerrar
      await supabase
        .from("shifts")
        .update({
          closed_at: closeTimestamp,
          closed_by: currentUser?.id,
          total_real: 0,
          total_expected: 0,
        })
        .is("closed_at", null);

      // 3. Reasignar cualquier factura huérfana de este corte al ID del turno cerrado
      const orphanInvoices = paidInvoices.filter((i) => !i.shiftId || (currentShiftId && i.shiftId !== currentShiftId));
      for (const inv of orphanInvoices) {
        await supabase.from("invoices").update({ shift_id: currentShiftId }).eq("id", inv.id);
      }

      // 4. Abrir un único turno nuevo limpio
      const { data: newShift } = await supabase
        .from("shifts")
        .insert({
          opened_by: currentUser?.id,
        })
        .select()
        .single();

      if (newShift) {
        setCurrentShiftId(newShift.id);
        setShiftStartTime(newShift.opened_at);
      }

      setPaidInvoices([]);
      fetchData(true);
    } catch (closeErr) {
      console.error("Error al cerrar turno:", closeErr);
    }
  };

  const cancelTableOrder = async (tableId) => {
    const sTableId = String(tableId);

    // OPTIMISTIC LOCAL UPDATE
    setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));
    pendingSyncTablesRef.current.set(sTableId, {
      isDeleted: true,
      timestamp: Date.now(),
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineAction('CANCEL_ORDER', { tableId: sTableId });
      setPendingSyncCount(getOfflineQueue().length);
      return;
    }

    try {
      await supabase.from("orders").delete().eq("table_id", sTableId);
      await supabase.from("tables").delete().eq("id", sTableId);
      fetchData(true);
    } catch (err) {
      console.error("Error al cancelar orden en Supabase, encolando:", err);
      enqueueOfflineAction('CANCEL_ORDER', { tableId: sTableId });
      setPendingSyncCount(getOfflineQueue().length);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addProduct = async (newProd, imageFile) => {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { data: insertedProduct, error } = await supabase
      .from("products")
      .insert({
        name: newProd.name,
        category_id: newProd.category,
        price: newProd.price,
        cost: newProd.cost,
        stock: newProd.stock,
        icon_path: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting product:", error);
    } else if (insertedProduct && newProd.bundleItems && newProd.bundleItems.length > 0) {
      for (const bundle of newProd.bundleItems) {
        await supabase.from("product_bundles").insert({
          promotion_id: insertedProduct.id,
          base_product_id: bundle.productId,
          quantity_to_deduct: bundle.quantity,
        });
      }
    }

    fetchData();
  };

  const updateProduct = async (updatedProd, imageFile) => {
    let imageUrl = updatedProd.image; // Keep existing
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: updatedProd.name,
        category_id: updatedProd.category,
        price: updatedProd.price,
        cost: updatedProd.cost,
        stock: updatedProd.stock,
        icon_path: imageUrl,
      })
      .eq("id", updatedProd.id);

    if (error) {
      console.error("Error updating product:", error);
    } else {
      // Sincronizar product_bundles si es promocion
      await supabase.from("product_bundles").delete().eq("promotion_id", updatedProd.id);
      if (updatedProd.bundleItems && updatedProd.bundleItems.length > 0) {
        for (const bundle of updatedProd.bundleItems) {
          await supabase.from("product_bundles").insert({
            promotion_id: updatedProd.id,
            base_product_id: bundle.productId,
            quantity_to_deduct: bundle.quantity,
          });
        }
      }
    }

    fetchData();
  };

  const deleteProduct = async (productId) => {
    await supabase.from("products").delete().eq("id", productId);
    fetchData();
  };

  const updateStock = async (productId, newStock) => {
    await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", productId);
    fetchData();
  };

  const addUser = async (newUser) => {
    await supabase.from("users").insert({
      name: newUser.name,
      username: newUser.username,
      password_hash: newUser.password || "1234",
      role: newUser.role,
      is_active: true,
    });
    fetchData();
  };

  const updateUser = async (updatedUser) => {
    await supabase
      .from("users")
      .update({
        name: updatedUser.name,
        username: updatedUser.username,
        password_hash: updatedUser.password,
        role: updatedUser.role,
        is_active: updatedUser.active,
      })
      .eq("id", updatedUser.id);
    fetchData();
  };

  const deleteUser = async (userId) => {
    await supabase.from("users").delete().eq("id", userId);
    fetchData();
  };

  const updateExchangeRate = async (newRate) => {
    await supabase
      .from("settings")
      .upsert({ key: "exchange_rate", value: newRate }, { onConflict: "key" });
    fetchData();
  };

  const addExpense = async (newExpense) => {
    await supabase.from("expenses").insert({
      shift_id: currentShiftId,
      description: newExpense.description,
      category: newExpense.category,
      amount: newExpense.amount,
      is_paid: newExpense.isPaid,
      notification_date: newExpense.notificationDate,
    });
    fetchData();
  };

  const updateExpense = async (updatedExpense) => {
    await supabase
      .from("expenses")
      .update({
        description: updatedExpense.description,
        category: updatedExpense.category,
        amount: updatedExpense.amount,
        is_paid: updatedExpense.isPaid,
        notification_date: updatedExpense.notificationDate,
      })
      .eq("id", updatedExpense.id);
    fetchData();
  };

  const deleteExpense = async (expenseId) => {
    await supabase.from("expenses").delete().eq("id", expenseId);
    fetchData();
  };

  const login = (username, password) => {
    const targetName = username.trim().toLowerCase();
    const targetPass = password.trim();
    const foundUser = users.find(
      (u) =>
        u.username?.toLowerCase() === targetName && u.password === targetPass,
    );

    if (!foundUser)
      return { success: false, message: "Usuario o contraseña incorrectos." };
    if (!foundUser.active)
      return { success: false, message: "Este usuario se encuentra inactivo." };

    const sessionData = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role: foundUser.role,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setCurrentRole(foundUser.role);
    return { success: true, user: sessionData };
  };

  const loginMesero = (pin, expectedRole = null) => {
    const targetPass = pin.trim();
    const foundUser = users.find((u) => {
      const roleMatch = expectedRole ? u.role === expectedRole : (u.role === "mesero" || u.role === "cajero");
      return roleMatch && u.password === targetPass;
    });

    if (!foundUser)
      return {
        success: false,
        message: expectedRole === "cajero" 
          ? "PIN incorrecto o cajero no encontrado." 
          : expectedRole === "mesero"
          ? "PIN incorrecto o mesero no encontrado."
          : "PIN incorrecto o usuario no encontrado.",
      };
    if (!foundUser.active)
      return { success: false, message: "Este usuario se encuentra inactivo." };

    const sessionData = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role: foundUser.role,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setCurrentRole(foundUser.role);
    return { success: true, user: sessionData };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  if (isLoading && !products.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 font-bold text-xl">
        Conectando al Servidor Principal...
      </div>
    );
  }

  return (
    <BarContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        users,
        tables,
        products,
        paidInvoices,
        shiftStartTime,
        cashRegisterHistory,
        exchangeRate,
        expenses,
        isOnline,
        pendingSyncCount,
        syncOfflineQueue: () => syncOfflineQueue(supabase, ({ synced, remaining }) => {
          setPendingSyncCount(remaining);
          if (synced > 0) fetchData(true);
        }),
        updateTableOrder,
        sendOrderToCashier,
        payInvoice,
        cancelTableOrder,
        clearUnprintedItems,
        addBarAccount,
        closeShift,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addUser,
        updateUser,
        deleteUser,
        updateExchangeRate,
        addExpense,
        updateExpense,
        deleteExpense,
        login,
        loginMesero,
        logout,
        openTable,
        addNewTable,
        deleteTable,
        categories,
      }}
    >
      {children}
    </BarContext.Provider>
  );
};

export const useBar = () => {
  const context = useContext(BarContext);
  if (!context) throw new Error("useBar debe usarse dentro de un BarProvider");
  return context;
};
