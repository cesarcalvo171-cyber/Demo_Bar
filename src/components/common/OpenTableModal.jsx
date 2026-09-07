import React, { useState, useEffect, useRef } from "react";
import { MdTableRestaurant } from "react-icons/md";
import { User, X, PlusCircle } from "lucide-react";
import { useBar } from "../../context/BarContext";

export const OpenTableModal = ({ isOpen, onClose, onTableCreated }) => {
  const { tables, openTable } = useBar();
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTableNumber("");
      setCustomerName("");
      setErrorMsg("");
      setIsSubmitting(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = tableNumber.trim();
    if (!cleanNum) {
      setErrorMsg("Debes ingresar el número o identificador de la mesa.");
      return;
    }

    // Verificar si ya existe una mesa activa con ese mismo nombre o número
    const formattedCheck = cleanNum.toLowerCase().startsWith("mesa")
      ? cleanNum.toLowerCase()
      : `mesa ${cleanNum.toLowerCase()}`;
    
    const existingTable = tables.find(
      (t) => !t.isBar && t.name.toLowerCase().trim() === formattedCheck
    );

    if (existingTable) {
      setErrorMsg(`La ${existingTable.name} ya se encuentra abierta con un pedido activo.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const newId = await openTable({
        tableNumber: cleanNum,
        customerName: customerName.trim(),
      });

      if (newId) {
        if (onTableCreated) {
          onTableCreated(newId);
        }
        onClose();
      } else {
        setErrorMsg("Ocurrió un error al abrir la mesa.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error inesperado al abrir la mesa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <MdTableRestaurant className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white m-0">Abrir Nueva Mesa</h3>
              <p className="text-xs text-slate-400 m-0">Asigna el número de mesa y cliente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Número de Mesa <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                #
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ej. 1, 5, 12, Terraza 1..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Puedes ingresar solo el número (ej: 4) o una descripción (ej: VIP 2).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nombre del Cliente / Referencia
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej. Carlos Mendoza"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !tableNumber.trim()}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Abriendo..." : "Abrir Mesa"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
