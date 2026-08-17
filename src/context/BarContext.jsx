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

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      // Fetch Global Configs
      const { data: settingsData } = await supabase.from("settings").select("*");
      if (settingsData) {
        const rate = settingsData.find((s) => s.key === "exchange_rate");
        if (rate) setExchangeRate(rate.value);
      }

      // Fetch Categories from Supabase
      const { data: categoriesData } = await supabase.from("categories").select("*");
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

      if (tablesError) throw new Error("Fallo al obtener mesas: " + tablesError.message);
      if (ordersError) throw new Error("Fallo al obtener órdenes: " + ordersError.message);

      if (tablesData && productsData) {
        // Función auxiliar que resuelve los items de una mesa protegiendo contra race conditions
        const resolveTableItems = (tableId, dbTable, tableOrders) => {
          const sId = String(tableId);
          const pending = pendingSyncTablesRef.current.get(sId);
          if (pending && Date.now() - pending.timestamp < 300000) {
            return {
              status: pending.status || (pending.items.length > 0 ? "ocupada" : "libre"),
              customerName: pending.customerName || (dbTable?.customer_name || ""),
              items: pending.items,
              unprintedItems: pending.unprintedItems || [],
            };
          }
          return {
            status: dbTable?.status || "libre",
            customerName: dbTable?.customer_name || "",
            items: tableOrders.map((o) => {
              const pData = productsData.find(
                (p) => String(p.id) === String(o.product_id),
              );
              return {
                product: {
                  id: pData?.id,
                  name: pData?.name,
                  price: Number(pData?.price || 0),
                  cost: Number(pData?.cost || 0),
                  category: pData?.category_id,
                },
                quantity: o.quantity,
              };
            }),
            unprintedItems: tableOrders
              .filter((o) => !o.is_printed)
              .map((o) => {
                const pData = productsData.find(
                  (p) => String(p.id) === String(o.product_id),
                );
                return {
                  product: { id: pData?.id, name: pData?.name },
                  quantity: o.quantity,
                };
              }),
          };
        };

        // Assemble initial tables array with their orders
        newTables = INITIAL_TABLES.map((initTable) => {
          const dbTable = tablesData.find(
            (t) => String(t.id) === String(initTable.id),
          );
          const tableOrders =
            ordersData?.filter(
              (o) => String(o.table_id) === String(initTable.id),
            ) || [];

          const resolved = resolveTableItems(initTable.id, dbTable, tableOrders);

          return {
            ...initTable,
            id: String(initTable.id),
            status: resolved.status,
            customerName: resolved.customerName,
            assignedWaiterId: dbTable?.assigned_waiter_id,
            createdAt: dbTable?.created_at,
            items: resolved.items,
            unprintedItems: resolved.unprintedItems,
          };
        });

        // Add dynamically created bar accounts
        const barAccounts = tablesData.filter((t) => t.is_bar_account);
        for (const barAcc of barAccounts) {
          const tableOrders =
            ordersData?.filter(
              (o) => String(o.table_id) === String(barAcc.id),
            ) || [];
          const resolved = resolveTableItems(barAcc.id, barAcc, tableOrders);
          newTables.push({
            id: String(barAcc.id),
            name: barAcc.name,
            status: resolved.status,
            customerName: resolved.customerName,
            assignedWaiterId: barAcc.assigned_waiter_id,
            createdAt: barAcc.created_at,
            isBar: true,
            items: resolved.items,
            unprintedItems: resolved.unprintedItems,
          });
        }

        // Add extra normal tables created dynamically (e.g. Mesa 11, Mesa 12)
        const extraTables = tablesData.filter(
          (t) => !t.is_bar_account && !INITIAL_TABLES.some((init) => String(init.id) === String(t.id))
        );
        for (const extra of extraTables) {
          const tableOrders =
            ordersData?.filter(
              (o) => String(o.table_id) === String(extra.id),
            ) || [];
          const resolved = resolveTableItems(extra.id, extra, tableOrders);
          newTables.push({
            id: String(extra.id),
            name: extra.name || `Mesa ${extra.id}`,
            status: resolved.status,
            customerName: resolved.customerName,
            assignedWaiterId: extra.assigned_waiter_id,
            createdAt: extra.created_at,
            isBar: false,
            items: resolved.items,
            unprintedItems: resolved.unprintedItems,
          });
        }

        // Sort tables numerically so Mesa 1, Mesa 2, ... Mesa 11, Mesa 12 are in order
        newTables.sort((a, b) => {
          if (a.isBar && !b.isBar) return 1;
          if (!a.isBar && b.isBar) return -1;
          const numA = parseInt(a.id, 10);
          const numB = parseInt(b.id, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.name.localeCompare(b.name);
        });

        setTables(newTables);
      }

      // Fetch Shifts & Financials
      const { data: shiftsData } = await supabase
        .from("shifts")
        .select("*")
        .order("opened_at", { ascending: false });
      if (shiftsData && shiftsData.length > 0) {
        const activeShift = shiftsData.find((s) => !s.closed_at);
        const closedShifts = shiftsData.filter((s) => s.closed_at);
        const closedShiftIds = new Set(closedShifts.map((s) => s.id));

        if (activeShift) {
          setCurrentShiftId(activeShift.id);
          setShiftStartTime(activeShift.opened_at);
        }

        // Fetch all invoices
        const { data: invData } = await supabase.from("invoices").select("*");
        const { data: invItemsData } = await supabase
          .from("invoice_items")
          .select("*");

        const allMappedInvoices = (invData || []).map((inv) => {
          const items = (invItemsData || [])
            .filter((i) => i.invoice_id === inv.id)
            .map((i) => {
              const cleanItemName = (i.product_name || "").trim().toLowerCase();
              const pMatch = (productsData || []).find(
                (p) => p.name?.trim().toLowerCase() === cleanItemName
              ) || (INITIAL_PRODUCTS || []).find(
                (p) => p.name?.trim().toLowerCase() === cleanItemName
              );

              let resolvedCat = pMatch?.category;
              if (!resolvedCat || resolvedCat === "General" || resolvedCat === "general") {
                if (cleanItemName.includes("toña") || cleanItemName.includes("clasica") || cleanItemName.includes("spark") || cleanItemName.includes("heineken") || cleanItemName.includes("miller") || cleanItemName.includes("sol") || cleanItemName.includes("bambu") || cleanItemName.includes("smirnof")) {
                  resolvedCat = "cervezas";
                } else if (cleanItemName.includes("nachos") || cleanItemName.includes("alitas") || cleanItemName.includes("salchipapa") || cleanItemName.includes("hamburguesa") || cleanItemName.includes("hot dog") || cleanItemName.includes("consume") || cleanItemName.includes("toston")) {
                  resolvedCat = "comida";
                } else if (cleanItemName.includes("reserva") || cleanItemName.includes("lite") || cleanItemName.includes("plata") || cleanItemName.includes("ron") || cleanItemName.includes("licor")) {
                  resolvedCat = "licores";
                } else if (cleanItemName.includes("chubby") || cleanItemName.includes("gatorade") || cleanItemName.includes("power") || cleanItemName.includes("agua") || cleanItemName.includes("pepsi") || cleanItemName.includes("lipton")) {
                  resolvedCat = "Bebida sin alcohol";
                } else if (cleanItemName.includes("chiveria") || cleanItemName.includes("snack")) {
                  resolvedCat = "chiveria";
                } else {
                  resolvedCat = "General";
                }
              }

              return {
                name: i.product_name,
                quantity: i.quantity,
                price: Number(i.price_at_sale),
                cost: Number(i.cost_at_sale),
                category: resolvedCat,
              };
            });
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
            date: new Date(inv.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            items,
          };
        });

        // BLINDAJE DE CORTE Z: Incluye facturas del turno activo + cualquier factura huérfana/no cerrada
        currentShiftInvoices = allMappedInvoices.filter((i) => {
          if (activeShift && i.shiftId === activeShift.id) return true;
          // Si no tiene shiftId o su shiftId no está entre los turnos formalmente cerrados, pertenece al turno actual
          if (!i.shiftId || !closedShiftIds.has(i.shiftId)) return true;
          return false;
        });

        setPaidInvoices(currentShiftInvoices);

        // History logic
        calculatedHistory = closedShifts.map((cs) => {
          const cashier = (usersData || []).find(
              (u) => u.id === cs.closed_by || u.id === cs.opened_by
            );
            return {
              id: cs.id,
              cashierName: cashier?.name || "Cajero Principal",
              startTime: cs.opened_at,
              endTime: cs.closed_at,
              totalSales: Number(cs.total_real || cs.total_expected),
              totalCash: allMappedInvoices
                .filter(
                  (i) => i.shiftId === cs.id && i.paymentMethod === "Efectivo",
                )
                .reduce((s, i) => s + i.total, 0),
              totalCard: allMappedInvoices
                .filter(
                  (i) => i.shiftId === cs.id && i.paymentMethod !== "Efectivo",
                )
                .reduce((s, i) => s + i.total, 0),
              invoices: allMappedInvoices.filter((i) => i.shiftId === cs.id),
            };
          });
        setCashRegisterHistory(calculatedHistory);
      }

      // Fetch expenses
      const { data: expData } = await supabase.from("expenses").select("*");
      if (expData) {
        setExpenses(
          expData.map((e) => ({
            id: e.id,
            description: e.description,
            category: e.category,
            amount: Number(e.amount),
            isPaid: e.is_paid,
            notificationDate: e.notification_date,
            date: e.created_at,
          })),
        );
      }

      // Guardar snapshot para uso 100% offline
      saveOfflineSnapshot({
        products: mappedProducts,
        tables: newTables,
        categories: categoriesData,
        users: usersData,
        expenses: expData,
        exchangeRate,
        shiftId: currentShiftId,
        paidInvoices: currentShiftInvoices,
        cashRegisterHistory: calculatedHistory,
      });

    } catch (err) {
      console.warn("Conexión remota no disponible, usando caché offline:", err);
      // Fallback a Snapshot Offline si se cae el internet
      const snapshot = getOfflineSnapshot();
      if (snapshot) {
        if (snapshot.products && snapshot.products.length > 0) setProducts(snapshot.products);
        if (snapshot.tables && snapshot.tables.length > 0) setTables(snapshot.tables);
        if (snapshot.categories) setCategories(snapshot.categories);
        if (snapshot.users) setUsers(snapshot.users);
        if (snapshot.expenses) setExpenses(snapshot.expenses);
        if (snapshot.exchangeRate) setExchangeRate(snapshot.exchangeRate);
        if (snapshot.paidInvoices) setPaidInvoices(snapshot.paidInvoices);
        if (snapshot.cashRegisterHistory) setCashRegisterHistory(snapshot.cashRegisterHistory);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);

    const triggerSync = () => {
      fetchData(true);
    };

    // Auto-Sincronización al detectar que regresa el Internet
    const handleOnline = () => {
      console.log("🌐 Conexión a Internet restablecida. Sincronizando cola offline...");
      setIsOnline(true);
      syncOfflineQueue(supabase, ({ synced, remaining }) => {
        setPendingSyncCount(remaining);
        if (synced > 0) fetchData(true);
      });
    };

    const handleOffline = () => {
      console.warn("⚠️ Dispositivo sin conexión a Internet. Activando modo Local-First.");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Intentar sincronizar cola pendiente si hay internet al iniciar
    if (typeof navigator !== 'undefined' && navigator.onLine && getOfflineQueue().length > 0) {
      syncOfflineQueue(supabase, ({ remaining }) => {
        setPendingSyncCount(remaining);
        fetchData(true);
      });
    }

    // 1. Instant WebSocket Realtime Event Listener
    const channel = supabase
      .channel(`bar-realtime-live`)
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
        { event: "*", schema: "public", table: "invoices" },
        triggerSync,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        triggerSync,
      )
      .subscribe();

    // 2. High-frequency 2-second background sync fallback
    const syncInterval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        fetchData(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTableOrder = async (
    tableId,
    items,
    customerName = "",
    unprintedItems = null,
  ) => {
    try {
      const isOccupied = items.length > 0;
      const sTableId = String(tableId);

      // 1. Record in-flight pending state immediately to protect against background overwrites
      pendingSyncTablesRef.current.set(sTableId, {
        items,
        unprintedItems: unprintedItems || [],
        customerName,
        status: isOccupied ? "ocupada" : "libre",
        timestamp: Date.now(),
      });

      // 2. OPTIMISTIC UI UPDATE
      setTables((prevTables) =>
        prevTables.map((t) => {
          if (String(t.id) === sTableId) {
            return {
              ...t,
              status: isOccupied ? "ocupada" : "libre",
              customerName: customerName,
              assignedWaiterId: currentUser?.id,
              items: items,
              unprintedItems: unprintedItems || [],
            };
          }
          return t;
        }),
      );

      // 3. Debounced clean write to Supabase (200ms)
      if (updateOrderDebounceTimersRef.current.has(sTableId)) {
        clearTimeout(updateOrderDebounceTimersRef.current.get(sTableId));
      }

      const timerId = setTimeout(async () => {
        try {
          if (!navigator.onLine) {
            throw new Error("Sin conexión a internet (detectado localmente)");
          }

          const { error: e1 } = await supabase.from("tables").upsert(
            {
              id: sTableId,
              name:
                tables.find((t) => String(t.id) === sTableId)?.name ||
                `Mesa ${sTableId}`,
              status: isOccupied ? "ocupada" : "libre",
              customer_name: customerName,
              assigned_waiter_id: currentUser?.id,
              created_at: isOccupied ? new Date().toISOString() : null,
            },
            { onConflict: "id" },
          );
          if (e1) throw e1;

          const { error: e2 } = await supabase
            .from("orders")
            .delete()
            .eq("table_id", sTableId);
          if (e2) throw e2;

          if (isOccupied) {
            const ordersToInsert = items.map((i) => ({
              table_id: sTableId,
              product_id: String(i.product.id),
              quantity: i.quantity,
              is_printed: unprintedItems
                ? !unprintedItems.find(
                    (u) => String(u.product.id) === String(i.product.id),
                  )
                : true,
            }));
            const { error: e3 } = await supabase
              .from("orders")
              .insert(ordersToInsert);
            if (e3) throw e3;
          }
        } catch (dbErr) {
          console.warn("Database sync error (encolando offline):", dbErr.message || dbErr);
          
          // Encolar acción para sincronizarla cuando vuelva el internet
          const isBar = tables.find((t) => String(t.id) === sTableId)?.isBar || false;
          enqueueOfflineAction("UPDATE_ORDER", {
            tableId: sTableId,
            items: items,
            isBar: isBar,
            customerName: customerName,
            waiterId: currentUser?.id,
          });
          
          // Incrementar contador visual para el cajero
          setPendingSyncCount(getOfflineQueue().length);
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
      await supabase
        .from("orders")
        .update({ is_printed: true })
        .eq("table_id", sTableId);
    } catch (err) {
      console.error("Error clearing unprinted items:", err);
    }
  };

  const addBarAccount = async (customerName) => {
    try {
      const newBarId = `barra_${Date.now()}`;

      pendingSyncTablesRef.current.set(newBarId, {
        items: [],
        unprintedItems: [],
        customerName,
        status: "ocupada",
        timestamp: Date.now(),
      });

      // OPTIMISTIC UI UPDATE
      setTables((prev) => [
        ...prev,
        {
          id: newBarId,
          name: "Barra",
          status: "ocupada",
          customerName: customerName,
          assignedWaiterId: currentUser?.id,
          createdAt: new Date().toISOString(),
          isBar: true,
          items: [],
          unprintedItems: [],
        },
      ]);

      const { error } = await supabase.from("tables").insert({
        id: newBarId,
        name: "Barra",
        status: "ocupada",
        is_bar_account: true,
        customer_name: customerName,
        assigned_waiter_id: currentUser?.id,
        created_at: new Date().toISOString(),
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
  // Función para crear una nueva mesa consecutiva (Mesa 11, Mesa 12, etc.)
  const addNewTable = async () => {
    try {
      // 1. Consultar a Supabase todas las mesas existentes para encontrar el número más alto
      const { data: allTables } = await supabase.from('tables').select('id, name, is_bar_account');
      
      let maxNumber = 10;
      if (allTables && allTables.length > 0) {
        allTables.forEach(t => {
          if (!t.is_bar_account) {
            const num = parseInt(t.id, 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        });
      }

      const nextNumber = maxNumber + 1;
      const nextId = String(nextNumber);
      const tableName = `Mesa ${nextNumber}`;

      // 2. Inserta la nueva mesa en Supabase
      const { error } = await supabase.from("tables").insert({
        id: nextId,
        name: tableName,
        status: "libre",
        is_bar_account: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error creando mesa:", error);
        alert("No se pudo crear la mesa: " + error.message);
        return null;
      }

      // 3. Sincroniza los datos
      await fetchData(true);
      return nextId;
    } catch (err) {
      console.error("Crash creando mesa:", err);
      return null;
    }
  };

  // Función para eliminar mesas extras creadas dinámicamente
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
      await fetchData(true);
    } catch (err) {
      console.error("Error al eliminar mesa extra:", err);
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
    pendingSyncTablesRef.current.set(sTableId, {
      items: [],
      unprintedItems: [],
      customerName: "",
      status: "libre",
      timestamp: Date.now(),
    });

    const table = tables.find((t) => String(t.id) === sTableId);
    if (!table || table.items.length === 0) return;

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
      if (table.isBar) {
        await supabase.from("tables").delete().eq("id", sTableId);
      } else {
        await supabase.from("tables").update({
          status: "libre",
          customer_name: null,
          assigned_waiter_id: null,
          created_at: null,
        }).eq("id", sTableId);
      }
      await supabase.from("orders").delete().eq("table_id", sTableId);

      fetchData(true);
    } catch (err) {
      console.error("Error al enviar factura a Supabase, encolando offline:", err);
      enqueueOfflineAction('CREATE_INVOICE', {
        invoice: invoicePayload,
        invoiceItems: invoiceItemsPayload,
        stockDeductions,
        tableInfo: { id: sTableId, isBar: table.isBar }
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
    const table = tables.find((t) => String(t.id) === sTableId);

    // OPTIMISTIC LOCAL UPDATE
    if (table?.isBar) {
      setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));
    } else {
      setTables((prev) =>
        prev.map((t) =>
          String(t.id) === sTableId
            ? { ...t, status: "libre", customerName: "", items: [], unprintedItems: [] }
            : t
        )
      );
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineAction('CANCEL_ORDER', { tableId: sTableId, isBar: Boolean(table?.isBar) });
      setPendingSyncCount(getOfflineQueue().length);
      return;
    }

    try {
      await supabase.from("orders").delete().eq("table_id", sTableId);
      if (table?.isBar) {
        await supabase.from("tables").delete().eq("id", sTableId);
      } else {
        await supabase
          .from("tables")
          .update({ status: "libre", customer_name: null })
          .eq("id", sTableId);
      }
      fetchData(true);
    } catch (err) {
      console.error("Error al cancelar orden en Supabase, encolando:", err);
      enqueueOfflineAction('CANCEL_ORDER', { tableId: sTableId, isBar: Boolean(table?.isBar) });
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
