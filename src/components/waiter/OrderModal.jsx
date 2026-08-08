import React, { useState } from "react";
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
} from "lucide-react";
import { FaBookmark } from "react-icons/fa";

export const OrderModal = ({ table, onClose }) => {
  const {
    updateTableOrder,
    sendOrderToCashier,
    cancelTableOrder,
    clearUnprintedItems,
    currentUser,
    exchangeRate
  } = useBar();
  const [selectedCategory, setSelectedCategory] = useState("comida");
  //Cconstante que contiene los items del pedido de la mesa, si no tiene items se inicializa como un array vacío
  const items = table.items || [];
  const unprintedItems = table.unprintedItems || [];
  const [customerName, setCustomerName] = useState(table.customerName || "");
  const [showPreview, setShowPreview] = useState(false);
  const [showComanda, setShowComanda] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, SetSearch] = useState("");
  const [mobileView, setMobileView] = useState("catalog"); // "catalog" | "order"

  // Ambos roles tienen acceso total según lo solicitado por el usuario
  const isOwnerOrAdmin = true;

  // Agregar producto y guardar en tiempo real
  const handleAddProduct = (product) => {
    let newItems = [...items];
    const existingIndex = newItems.findIndex(
      (i) => String(i.product.id) === String(product.id),
    );

    if (existingIndex >= 0) {
      if (
        product.stock !== null &&
        newItems[existingIndex].quantity >= product.stock
      ) {
        setErrorMsg(`Stock máximo alcanzado para ${product.name}`);
        setTimeout(() => setErrorMsg(""), 3000);
        return;
      }
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 };
    } else {
      newItems.push({ product, quantity: 1 });
    }

    // Lógica para la Comanda (elementos sin imprimir)
    let newUnprinted = [...unprintedItems];
    const existingUnprinted = newUnprinted.findIndex((i) => String(i.product.id) === String(product.id));
    if (existingUnprinted >= 0) {
      newUnprinted[existingUnprinted] = { ...newUnprinted[existingUnprinted], quantity: newUnprinted[existingUnprinted].quantity + 1 };
    } else {
      newUnprinted.push({ product, quantity: 1 });
    }

    // Guardar directo en la base de datos global
    updateTableOrder(table.id, newItems, customerName, newUnprinted);
  };

  // Reducir o eliminar cantidad
  const handleQuantity = (productId, delta) => {
    let newItems = items
      .map((i) => {
        if (String(i.product.id) === String(productId)) {
          return { ...i, quantity: i.quantity + delta };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    let newUnprinted = unprintedItems
      .map((i) => {
        if (String(i.product.id) === String(productId)) {
          return { ...i, quantity: Math.max(0, i.quantity + delta) };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    // Guardar directo en la base de datos global
    updateTableOrder(table.id, newItems, customerName, newUnprinted);
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0,
    );
  };

  // Guardar cambios sin cerrar mesa (solo pedido activo)
  const handleSaveOrder = () => {
    updateTableOrder(table.id, items, customerName);
    onClose();
  };

  // Enviar a caja
  const handleSendToCashierSubmit = (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg("Debes ingresar Referencia/Cliente en la parte superior.");
      return;
    }
    updateTableOrder(table.id, items, customerName);
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
    clearUnprintedItems(table.id);
  };

  const handleClearTable = () => {
    if (confirm(`¿Estás seguro de cancelar el pedido de la ${table.name}?`)) {
      cancelTableOrder(table.id);
      onClose();
    }
  };
  
  return (
    <div className="flex flex-col h-full min-h-0 flex-1 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 h-full overflow-hidden">
        {/* Columna Izquierda: Catálogo de Productos */}
        <div className={`flex-1 lg:border-r border-slate-700/50 lg:pr-5 flex-col overflow-hidden min-h-0 pb-20 lg:pb-0 ${mobileView === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
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
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>
          <ProductCatalog
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectProduct={handleAddProduct}
            currentOrderItems={items}
            search={search}
          />
        </div>

        {/* Columna Derecha: Detalle de la Mesa y Pedido */}
        <div className={`w-full lg:w-[390px] flex flex-col bg-[#191c25] p-3.5 sm:p-4 rounded-xl lg:rounded-none h-full min-h-0 overflow-hidden ${mobileView === 'order' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Encabezado y Nombre del Cliente */}
          <div className="shrink-0">
            <div className="flex justify-between items-start pb-2.5 border-b border-slate-700/50 mb-2.5">
              <div>
                <h3 className="font-bold text-slate-100 text-base m-0 mb-1">
                  {table.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 m-0 flex-wrap">
                  Estado:
                  <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {items.length > 0 ? "Con pedido" : "Vacía"}
                  </span>
                  {table.assignedWaiterName && (
                    <span className="font-extrabold px-2 py-0.5 rounded border text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                      👤 {table.assignedWaiterName}
                    </span>
                  )}
                </div>
              </div>
              {items.length > 0 && (
                <button
                  onClick={handleClearTable}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer py-1 px-2 rounded hover:bg-red-500/10 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="mb-2.5">
              <div className="relative">
                <UserCheck className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Referencia o Cliente (Ej. Juan Pérez)"
                  value={customerName}
                  onBlur={() => updateTableOrder(table.id, items, customerName)}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#15171e] border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-400/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Lista de Items Seleccionados con Touch Momentum Scroll */}
          <div 
            className="space-y-2 flex-1 overflow-y-auto pr-1 my-1 min-h-0 touch-pan-y custom-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2.5 py-6">
                <Receipt className="w-9 h-9 opacity-40" />
                <p className="text-xs leading-relaxed text-slate-400">
                  No hay productos en esta mesa.
                  <br />
                  Toca los productos del catálogo
                  <br />
                  para agregarlos aquí.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product?.id || Math.random()}
                  className="bg-[#222533] p-2.5 rounded-lg border border-slate-700/50 flex flex-col gap-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-100 text-sm m-0 leading-tight">
                      {item.product?.name || 'Producto'}
                    </p>
                    <p className="text-slate-300 text-sm font-bold m-0">
                      C${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      C${(item.product?.price || 0).toFixed(2)} c/u
                    </span>
                    <div className="flex items-center bg-[#15171e] rounded-md border border-slate-700">
                      <button
                        onClick={() => handleQuantity(item.product.id, -1)}
                        className="px-2 py-1 hover:bg-slate-800 rounded-l-md cursor-pointer text-slate-400 transition-colors active:bg-slate-700"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="font-bold text-slate-200 w-7 text-center text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantity(item.product.id, 1)}
                        className="px-2 py-1 hover:bg-slate-800 rounded-r-md cursor-pointer text-slate-400 transition-colors active:bg-slate-700"
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
          <div className="border-t border-slate-700/60 pt-3 mt-auto shrink-0 bg-[#191c25] pb-24 lg:pb-1">
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-bold text-slate-400 text-xs tracking-wider">
                TOTAL:
              </span>

              <div className="text-right">
                <span className="font-extrabold text-orange-400 text-xl">
                  C${calculateTotal().toFixed(2)}
                </span>
              </div>
              <div className="text-slate-400 text-xs font-bold mt-0.5">
                (US$ {(calculateTotal() / (exchangeRate || 36.62)).toFixed(2)})
              </div>
            </div>

            {/* Botones de Acción Disponibles para Ambos Roles */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={unprintedItems.length === 0}
                onClick={() => setShowComanda(true)}
                className="w-full bg-slate-900 text-yellow-500 font-bold py-2.5 rounded-lg text-sm hover:bg-slate-800 border border-slate-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-sm relative active:scale-[0.99]"
              >
                Imprimir Comanda
                {unprintedItems.length > 0 && (
                  <span className="absolute right-3 bg-yellow-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unprintedItems.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setShowPreview(true)}
                className="w-full bg-slate-800 text-slate-200 font-bold py-2.5 rounded-lg text-sm hover:bg-slate-700 border border-slate-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <Printer className="w-4 h-4 text-slate-400" /> Imprimir Pre-cuenta / Factura
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante para cambiar de vista en móvil */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 p-3 bg-slate-900 border-t border-slate-800 shrink-0 z-20 rounded-b-xl shadow-[0_-10px_20px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => setMobileView(v => v === 'catalog' ? 'order' : 'catalog')}
          className={`w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors active:scale-[0.99] ${mobileView === 'catalog' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
          {mobileView === 'catalog' ? (
            <>
              Ver Pedido ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
              <span className="bg-indigo-800 px-3 py-0.5 rounded-full text-xs shadow-inner">
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
          items={items}
          customerName={customerName}
          onClose={handleCloseAfterPrint}
        />
      )}

      {showComanda && (
        <ComandaPreview
          table={table}
          items={unprintedItems}
          waiterName={table.assignedWaiterName}
          onClose={handleCloseComanda}
        />
      )}
    </div>
  );
};
