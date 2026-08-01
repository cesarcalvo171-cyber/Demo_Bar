import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_TABLES, INITIAL_PRODUCTS } from '../mock/initialData';

const BarContext = createContext();

const STORAGE_KEY = 'bar_app_state_v1';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return null;
  }
};

const SESSION_KEY = 'bar_active_session_v1';

const loadSessionUser = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

const INITIAL_USERS = [
  { id: 1, name: 'Administrador Principal', username: 'admin', password: '123456', role: 'admin', active: true },
];

export const BarProvider = ({ children }) => {
  const savedState = loadState();

  const [currentUser, setCurrentUser] = useState(loadSessionUser());
  const [currentRole, setCurrentRole] = useState(currentUser?.role || 'mesero');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [shiftStartTime, setShiftStartTime] = useState(new Date().toISOString());
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]);

  // Sincronizar estado al localStorage cada vez que hay un cambio local (excepto currentRole)
  useEffect(() => {
    const stateToSave = {
      users,
      tables,
      products,
      paidInvoices,
      shiftStartTime,
      cashRegisterHistory
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [users, tables, products, paidInvoices, shiftStartTime, cashRegisterHistory]);

  // Escuchar eventos de storage (cambios desde otras pestañas del mismo navegador)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          // No actualizamos currentRole porque cada pestaña debe poder tener su propio rol
          if (newState.users) setUsers(newState.users);
          setTables(newState.tables);
          setProducts(newState.products);
          setPaidInvoices(newState.paidInvoices);
          setShiftStartTime(newState.shiftStartTime);
          setCashRegisterHistory(newState.cashRegisterHistory);
        } catch (err) {
          console.error("Error parsing storage", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Actualizar pedido de una mesa
  const updateTableOrder = (tableId, items) => {
    setTables(prev =>
      prev.map(table => {
        if (table.id === tableId) {
          const isOccupied = items.length > 0;
          const assignedWaiterId = isOccupied ? (table.assignedWaiterId || currentUser?.id) : null;
          const assignedWaiterName = isOccupied ? (table.assignedWaiterName || currentUser?.name) : null;

          return {
            ...table,
            items,
            assignedWaiterId,
            assignedWaiterName,
            status: isOccupied ? 'ocupada' : 'libre',
            createdAt: isOccupied ? (table.createdAt || new Date().toISOString()) : null
          };
        }
        return table;
      })
    );
  };

  // Enviar pedido a caja para cobrar
  const sendOrderToCashier = (tableId, customerName) => {
    setTables(prev =>
      prev.map(table => {
        if (table.id === tableId) {
          return {
            ...table,
            customerName: customerName.trim() || 'Cliente General',
            waiterName: table.assignedWaiterName || currentUser?.name || 'Mesero En Atenciones',
            status: 'pendiente_pago'
          };
        }
        return table;
      })
    );
  };

  // Pagar y cerrar factura de una mesa desde el rol Cajero
  const payInvoice = (tableId, paymentMethod, transactionId = '') => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.items.length === 0) return;

    const total = table.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const now = new Date();

    const newInvoice = {
      id: `FAC-${1000 + cashRegisterHistory.reduce((acc, c) => acc + c.invoices.length, 0) + paidInvoices.length + 1}`,
      tableId: table.id,
      tableName: table.name,
      customerName: table.customerName || 'Cliente General',
      waiterName: table.assignedWaiterName || table.waiterName || currentUser?.name || 'Mesero',
      items: table.items.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price
      })),
      total,
      paymentMethod,
      transactionId,
      fullDate: now.toISOString(),
      date: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Descontar inventario (excluyendo comidas)
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        if (prod.category === 'comida') return prod; // Las comidas no descuentan stock
        const itemOrdered = table.items.find(i => i.product.id === prod.id);
        if (itemOrdered) {
          return { ...prod, stock: Math.max(0, (prod.stock ?? 0) - itemOrdered.quantity) };
        }
        return prod;
      })
    );

    // Agregar a facturas pagadas
    setPaidInvoices(prev => [newInvoice, ...prev]);

    // Liberar la mesa
    setTables(prev =>
      prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'libre',
            customerName: '',
            assignedWaiterId: null,
            assignedWaiterName: null,
            items: [],
            createdAt: null
          };
        }
        return t;
      })
    );
  };

  // Cierre de Caja
  const closeCashRegister = (cashierName = 'Cajero Principal') => {
    if (paidInvoices.length === 0) return false;

    const totalCash = paidInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, i) => sum + i.total, 0);
    const totalCard = paidInvoices.filter(i => i.paymentMethod === 'Tarjeta').reduce((sum, i) => sum + i.total, 0);
    const totalSales = totalCash + totalCard;

    const closure = {
      id: `CIERRE-${1000 + cashRegisterHistory.length + 1}`,
      cashierName: cashierName.trim() || 'Cajero Principal',
      openTime: shiftStartTime,
      closeTime: new Date().toISOString(),
      totalSales,
      totalCash,
      totalCard,
      invoices: [...paidInvoices]
    };

    setCashRegisterHistory(prev => [closure, ...prev]);
    setPaidInvoices([]); // Limpia el turno actual
    setShiftStartTime(new Date().toISOString()); // Inicia nuevo turno
    
    return true;
  };

  // Cancelar pedido/Liberar mesa si fue erróneo
  const cancelTableOrder = (tableId) => {
    setTables(prev =>
      prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'libre',
            customerName: '',
            items: [],
            createdAt: null
          };
        }
        return t;
      })
    );
  };

  // CRUD Catálogo (Para el Cajero)
  const addProduct = (newProd) => {
    const id = Date.now();
    setProducts(prev => [...prev, { ...newProd, id, price: Number(newProd.price), stock: Number(newProd.stock) }]);
  };

  const updateProduct = (updatedProd) => {
    setProducts(prev =>
      prev.map(p => (p.id === updatedProd.id ? { ...updatedProd, price: Number(updatedProd.price), stock: Number(updatedProd.stock) } : p))
    );
  };

  const deleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Actualizar Stock directamente
  const updateStock = (productId, newStock) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, Number(newStock)) } : p))
    );
  };

  // Autenticación de Usuarios
  const login = (username, password) => {
    const targetName = username.trim().toLowerCase();
    const targetPass = password.trim();

    const foundUser = users.find(u => {
      const uName = u.username.trim().toLowerCase();
      if (uName !== targetName) return false;
      const expectedPass = uName === 'admin' ? '123456' : (u.password || '1234');
      return expectedPass === targetPass;
    });

    if (!foundUser) {
      return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }

    if (foundUser.active === false) {
      return { success: false, message: 'Este usuario se encuentra inactivo.' };
    }

    const sessionData = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role: foundUser.role
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

  // CRUD Usuarios (Para Admin)
  const addUser = (newUser) => {
    setUsers(prev => {
      const maxId = prev.reduce((max, u) => (typeof u.id === 'number' && u.id < 100000 ? Math.max(max, u.id) : max), 0);
      const nextId = maxId + 1;
      return [...prev, { ...newUser, password: newUser.password || '1234', id: nextId, active: true }];
    });
  };

  const updateUser = (updatedUser) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

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
        updateTableOrder,
        sendOrderToCashier,
        payInvoice,
        closeCashRegister,
        cancelTableOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addUser,
        updateUser,
        deleteUser,
        login,
        logout
      }}
    >
      {children}
    </BarContext.Provider>
  );
};

export const useBar = () => {
  const context = useContext(BarContext);
  if (!context) {
    throw new Error('useBar debe usarse dentro de un BarProvider');
  }
  return context;
};
