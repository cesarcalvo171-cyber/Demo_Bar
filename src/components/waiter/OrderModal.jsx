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

  // Validar si el usuario activo es el mesero que abrió la mesa o si es Administrador
  const isOwnerOrAdmin =
    currentUser?.role === "admin" ||
    !table.assignedWaiterId ||
    table.assignedWaiterId === currentUser?.id;

  // Agregar producto y guardar en tiempo real
  // Agregar producto y guardar en tiempo real
  const handleAddProduct = (product) => {
    if (!isOwnerOrAdmin) {
      setErrorMsg(
        `Mesa atendida por ${table.assignedWaiterName}. No tienes permisos.`,
      );
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    let newItems = [...items];
    const existingIndex = newItems.findIndex(
      (i) => i.product.id === product.id,
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
    const existingUnprinted = newUnprinted.findIndex((i) => i.product.id === product.id);
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
        if (i.product.id === productId) {
          return { ...i, quantity: i.quantity + delta };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    let newUnprinted = unprintedItems
      .map((i) => {
        if (i.product.id === productId) {
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
      (sum, item) => sum + item.product.price * item.quantity,
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
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Columna Izquierda: Catálogo de Productos */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-200 lg:pr-6 flex flex-col overflow-hidden">
        {errorMsg && (
          <div className="mb-2 bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div className="relative mb-4">
          <MdOutlineSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => SetSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="w-full lg:w-[380px] flex flex-col justify-between bg-slate-50 p-5 rounded-r-xl border-l border-slate-200">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base m-0 mb-1">
                {table.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 m-0 flex-wrap">
                Estado:
                <span className="font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                  {items.length > 0 ? "Con pedido" : "Vacía"}
                </span>
                {table.assignedWaiterName && (
                  <span
                    className={`font-extrabold px-2 py-0.5 rounded border text-[10px] ${
                      isOwnerOrAdmin
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }`}
                  >
                    👤 {table.assignedWaiterName}
                  </span>
                )}
              </div>
            </div>
            {items.length > 0 && isOwnerOrAdmin && (
              <button
                onClick={handleClearTable}
                className="text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <UserCheck className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              {/* Input para ingresar el nombre del cliente o referencia */}
              <input
                type="text"
                placeholder="Referencia o Cliente (Ej. Juan Pérez)"
                value={customerName}
                onBlur={() => updateTableOrder(table.id, items, customerName)} //guardamos datos al terminar de escribir
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!isOwnerOrAdmin}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {!isOwnerOrAdmin && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2 text-red-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>
                Mesa atendida por {table.assignedWaiterName}. Solo lectura.
              </span>
            </div>
          )}

          {/* Lista de Items Seleccionados */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 mb-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3 py-10">
                <Receipt className="w-12 h-12 opacity-50" />
                <p className="text-sm">
                  No hay productos en esta mesa.
                  <br />
                  Haz clic en los productos a la
                  <br />
                  izquierda para agregar.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-[#222533] p-2.5 rounded-lg border border-slate-700/50 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-100 text-sm m-0 leading-tight">
                      {item.product.name}
                    </p>
                    <p className="text-slate-400 text-sm font-semibold m-0">
                      C${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center bg-[#15171e] rounded-md border border-slate-700">
                      {isOwnerOrAdmin ? (
                        <>
                          <button
                            onClick={() => handleQuantity(item.product.id, -1)}
                            className="px-2.5 py-1.5 hover:bg-slate-800 rounded-l-md cursor-pointer text-slate-400 transition-colors"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-bold text-slate-200 w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantity(item.product.id, 1)}
                            className="px-2.5 py-1.5 hover:bg-slate-800 rounded-r-md cursor-pointer text-slate-400 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="font-bold text-slate-300 px-3 py-1 text-xs">
                          Cant: {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumen Total y Acciones */}
        <div className="border-t border-slate-700/50 pt-4 mt-auto">
          <div className="flex justify-between items-center mb-5">
            <span className="font-bold text-slate-400 text-xs tracking-wider">
              TOTAL:
            </span>

            <div className="text-right">
              <span className="font-extrabold text-orange-300 text-xl">
                C${calculateTotal().toFixed(2)}
              </span>
            </div>
            <div className="text-slate-400 text-xs font-bold mt-0.5">
              (US$ {(calculateTotal() / exchangeRate).toFixed(2)})
            </div>
          </div>

          {!isOwnerOrAdmin ? (
            <div className="bg-slate-800 p-3 rounded-lg text-center text-xs text-slate-400 font-semibold border border-slate-700">
              🔒 Esta mesa pertenece a {table.assignedWaiterName}. Solo el
              titular o un Administrador pueden modificar el pedido.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={unprintedItems.length === 0}
                onClick={() => setShowComanda(true)}
                className="w-full bg-slate-900 text-yellow-500 font-bold py-3 rounded-lg text-sm hover:bg-slate-800 border border-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm relative"
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
                className="w-full bg-[#1e293b] text-slate-300 font-bold py-3 rounded-lg text-sm hover:bg-[#334155] border border-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> Imprimir Pre-cuenta
              </button>
            </div>
          )}
        </div>
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
