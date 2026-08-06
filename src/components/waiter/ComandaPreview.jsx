import React from 'react';
import { X, Printer } from 'lucide-react';

export const ComandaPreview = ({ table, items, waiterName, onClose }) => {
  const handlePrint = () => {
    window.print();
    onClose();
  };

  const currentDate = new Date().toLocaleDateString('es-NI');
  const currentTime = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center p-4 sm:p-6 z-50 print:bg-white print:p-0">
      <div className="bg-white w-full max-w-sm h-fit shadow-2xl overflow-hidden print:shadow-none print:w-[80mm] print:max-w-[80mm]">
        
        {/* ENCABEZADO TICKET */}
        <div className="p-6 text-center border-b border-dashed border-slate-300 print:p-4">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-1">COMANDA</h2>
          <p className="text-sm font-bold text-slate-600 mb-4">TICKET DE PREPARACIÓN</p>
          
          <div className="flex justify-between items-center text-sm font-bold text-slate-700 bg-slate-100 p-2 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-2">
            <span>{currentDate}</span>
            <span>{currentTime}</span>
          </div>
        </div>

        {/* DATOS DE LA MESA */}
        <div className="px-6 py-4 border-b border-dashed border-slate-300 bg-slate-50 print:bg-transparent print:p-4 print:py-2">
          <h1 className="text-3xl font-black text-slate-900 text-center uppercase tracking-wide">
            {table.name}
          </h1>
          <p className="text-center text-sm font-bold text-slate-600 mt-1 uppercase">
            MESERO: {waiterName || 'NO ASIGNADO'}
          </p>
        </div>

        {/* LISTA DE PRODUCTOS (Grande y Clara) */}
        <div className="px-6 py-5 print:p-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 font-mono">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <div className="font-black text-xl text-slate-900 pt-1 border-t border-slate-100 print:border-black/10">
                  {item.quantity}
                </div>
                <div className="font-bold text-base text-slate-800 leading-tight pt-1 border-t border-slate-100 print:border-black/10">
                  {item.product.name}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* PIE DE TICKET */}
        <div className="p-4 bg-slate-900 text-center print:hidden">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Printer className="w-5 h-5" /> Imprimir
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};
