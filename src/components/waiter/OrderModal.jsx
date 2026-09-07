import React, { useState, useEffect } from "react";
import { useBar } from "../../context/BarContext";
import { ProductCatalog } from "./ProductCatalog";
import { InvoicePreview } from "./InvoicePreview";
import { ComandaPreview } from "./ComandaPreview";
import { MdOutlineSearch } from "react-icons/md";
import {
  Trash2,
  Plus,
  Minus,
  Send,
  UserCheck,
  AlertCircle,
  Receipt,
  Printer,
  XCircle,
} from "lucide-react";
import { FaBookmark } from "react-icons/fa";

export const OrderModal = ({ table, onClose }) => {
  const {
    updateTableOrder,
    sendOrderToCashier,
    cancelTableOrder,
    clearUnprintedItems,
    deleteTable,
    currentUser,
    exchangeRate,
  } = useBar();
  const [selectedCategory, setSelectedCategory] = useState("cervezas");
  
  // Estado local atómico e independiente para items de la mesa
  const [localItems, setLocalItems] = useState(table.items || []);
  const [localUnprinted, setLocalUnprinted] = useState(table.unprintedItems || []);
  const [tableName, setTableName] = useState(table.name || "");
  const [customerName, setCustomerName] = useState(table.customerName || "");
  const [showPreview, setShowPreview] = useState(false);
  const [showComanda, setShowComanda] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, SetSearch] = useState("");
  const [mobileView, setMobileView] = useState("catalog"); // "catalog" | "order"

  // Sincronizar estado local al cambiar de mesa seleccionada
  useEffect(() => {
    setLocalItems(table.items || []);
    setLocalUnprinted(table.unprintedItems || []);
    setTableName(table.name || "");
    setCustomerName(table.customerName || "");
  }, [table.id, table.name]);

  // Ambos roles tienen acceso total según lo solicitado por el usuario
  const isOwnerOrAdmin = true;

  // Agregar producto y guardar en tiempo real de forma 100% atómica
  const handleAddProduct = (product) => {
    let nextItems = [...localItems];
    const existingIndex = nextItems.findIndex(
      (i) => String(i.product?.id) === String(product.id),
    );

    if (existingIndex >= 0) {
      if (
        product.stock !== null &&
        nextItems[existingIndex].quantity >= product.stock
      ) {
        setErrorMsg(`Stock máximo alcanzado para ${product.name}`);
        setTimeout(() => setErrorMsg(""), 3000);
        return;
      }
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextItems[existingIndex].quantity + 1,
      };
    } else {
      nextItems.push({ product, quantity: 1 });
    }

    let nextUnprinted = [...localUnprinted];
    const existingUnprinted = nextUnprinted.findIndex(
      (i) => String(i.product?.id) === String(product.id),
    );
    if (existingUnprinted >= 0) {
      nextUnprinted[existingUnprinted] = {
        ...nextUnprinted[existingUnprinted],
        quantity: nextUnprinted[existingUnprinted].quantity + 1,
      };
    } else {
      nextUnprinted.push({ product, quantity: 1 });
    }

    setLocalItems(nextItems);
    setLocalUnprinted(nextUnprinted);
    updateTableOrder(table.id, nextItems, customerName, nextUnprinted, tableName);
  };

  // Reducir o eliminar cantidad de forma atómica
  const handleQuantity = (productId, delta) => {
    let nextItems = localItems
      .map((i) => {
        if (String(i.product?.id) === String(productId)) {
          return { ...i, quantity: i.quantity + delta };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    let nextUnprinted = localUnprinted
      .map((i) => {
        if (String(i.product?.id) === String(productId)) {
          return { ...i, quantity: Math.max(0, i.quantity + delta) };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    setLocalItems(nextItems);
    setLocalUnprinted(nextUnprinted);
    updateTableOrder(table.id, nextItems, customerName, nextUnprinted, tableName);
  };

  const calculateTotal = () => {
    return localItems.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0,
    );
  };

  // Guardar cambios sin cerrar mesa (solo pedido activo)
  const handleSaveOrder = () => {
    updateTableOrder(table.id, localItems, customerName, localUnprinted, tableName);
    onClose();
  };

  // Enviar a caja
  const handleSendToCashierSubmit = (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg("Debes ingresar Referencia/Cliente en la parte superior.");
      return;
    }
    updateTableOrder(table.id, localItems, customerName, localUnprinted, tableName);
    sendOrderToCashier(table.id, customerName);
    onClose();
  };

  // Cerrar todo una vez el mesero terminó de imprimir la factura
  const handleCloseAfterPrint = () => {
    setShowPreview(false);
    onClose();
  };

  const handleCloseComanda = () => {
    setShowComanda(false);
    setLocalUnprinted([]);
    clearUnprintedItems(table.id);
  };

  const handleClearTable = () => {
    if (confirm(`¿Estás seguro de cancelar el pedido de la ${tableName || table.name}?`)) {
      setLocalItems([]);
      setLocalUnprinted([]);
      cancelTableOrder(table.id);
      onClose();
    }
  };
  
  return (
    <div className="flex flex-col h-full min-h-0 flex-1 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 h-full overflow-hidden">
        {/* Columna Izquierda: Catálogo de Productos */}
        <div className={`flex-1 lg:border-r border-slate-200 lg:pr-5 flex-col overflow-hidden min-h-0 pb-20 lg:pb-0 ${mobileView === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
          {errorMsg && (
            <div className="mb-2 bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="relative mb-3 shrink-0">
            <MdOutlineSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => SetSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <ProductCatalog
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectProduct={handleAddProduct}
            currentOrderItems={localItems}
            search={search}
          />
        </div>

        {/* Columna Derecha: Detalle de la Mesa y Pedido */}
        <div className={`w-full lg:w-[390px] flex flex-col bg-slate-50 border-l border-slate-200 p-3.5 sm:p-4 rounded-xl lg:rounded-none h-full min-h-0 overflow-hidden ${mobileView === 'order' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Encabezado y Nombre del Cliente */}
          <div className="shrink-0">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 mb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-base m-0 mb-1">
                  {tableName || table.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 m-0 flex-wrap">
                  Estado:
                  <span className="font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                    {localItems.length > 0 ? "Con pedido" : "Vacía"}
                  </span>
                  {table.assignedWaiterName && (
                  <span className="font-extrabold px-2 py-0.5 rounded border text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                    👤 {table.assignedWaiterName}
                  </span>
                )}
                </div>
              </div>

              {/* Botón Vaciar en la cabecera original */}
              {localItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTable}
                  title="Vaciar pedido"
                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            <div className="mb-2.5">
              <div className="relative">
                <label htmlFor="customer-input" className="block text-slate-700 text-xs font-semibold mb-1">
                  Nombre del Cliente / Referencia
                </label>
                <input
                  id="customer-input"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onBlur={() => updateTableOrder(table.id, localItems, customerName, localUnprinted, tableName)}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Lista de Items Seleccionados con Touch Momentum Scroll */}
          <div 
            className="space-y-2 flex-1 overflow-y-auto pr-1 my-1 min-h-0 touch-pan-y custom-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
          >
            {localItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2.5 py-6">
                <Receipt className="w-9 h-9 opacity-40 text-slate-400" />
                <p className="text-xs leading-relaxed text-slate-500">
                  No hay productos en esta mesa.
                  <br />
                  Toca los productos del catálogo
                  <br />
                  para agregarlos aquí.
                </p>
              </div>
            ) : (
              localItems.map((item) => (
                <div
                  key={item.product?.id || Math.random()}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col gap-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-sm m-0 leading-tight">
                      {item.product?.name || 'Producto'}
                    </p>
                    <p className="text-slate-900 text-sm font-bold m-0">
                      C${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      C${(item.product?.price || 0).toFixed(2)} c/u
                    </span>
                    <div className="flex items-center bg-slate-100 rounded-md border border-slate-300">
                      <button
                        onClick={() => handleQuantity(item.product.id, -1)}
                        className="px-2 py-1 hover:bg-slate-200 rounded-l-md cursor-pointer text-slate-600 transition-colors active:bg-slate-300"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="font-bold text-slate-800 w-7 text-center text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantity(item.product.id, 1)}
                        className="px-2 py-1 hover:bg-slate-200 rounded-r-md cursor-pointer text-slate-600 transition-colors active:bg-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen Total y Acciones Fijas Abajo */}
          <div className="border-t border-slate-200 pt-3 mt-auto shrink-0 bg-slate-50 pb-24 lg:pb-1">
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-bold text-slate-600 text-xs tracking-wider">
                TOTAL:
              </span>

              <div className="text-right">
                <span className="font-extrabold text-blue-700 text-xl">
                  C${calculateTotal().toFixed(2)}
                </span>
              </div>
              <div className="text-slate-500 text-xs font-bold mt-0.5">
                (US$ {(calculateTotal() / (exchangeRate || 36.62)).toFixed(2)})
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={localItems.length === 0}
                onClick={() => setShowPreview(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 active:scale-[0.99]"
              >
                <Printer className="w-4 h-4 text-white" /> Imprimir Pre-cuenta / Factura
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante para cambiar de vista en móvil */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 shrink-0 z-20 rounded-b-xl shadow-lg">
        <button
          onClick={() => setMobileView(v => v === 'catalog' ? 'order' : 'catalog')}
          className={`w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-colors active:scale-[0.99] ${mobileView === 'catalog' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'}`}
        >
          {mobileView === 'catalog' ? (
            <>
              Ver Pedido ({localItems.reduce((sum, i) => sum + i.quantity, 0)} items)
              <span className="bg-blue-800 px-3 py-0.5 rounded-full text-xs shadow-inner">
                C${calculateTotal().toFixed(2)}
              </span>
            </>
          ) : (
            <>Volver al Catálogo</>
          )}
        </button>
      </div>

      {showPreview && (
        <InvoicePreview
          table={table}
          items={localItems}
          customerName={customerName}
          onClose={handleCloseAfterPrint}
        />
      )}

      {showComanda && (
        <ComandaPreview
          table={table}
          items={localUnprinted}
          waiterName={table.assignedWaiterName}
          onClose={handleCloseComanda}
        />
      )}
    </div>
  );
};
