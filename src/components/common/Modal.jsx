import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-5xl',
  height = 'h-auto max-h-[92vh]' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} ${height} flex flex-col min-h-0 overflow-hidden border border-slate-200 transition-all`}>
        {/* Modal Header Azul */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 bg-blue-600 border-b border-blue-500 shrink-0 shadow-sm">
          <h2 className="text-base sm:text-xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            {title}
          </h2>
          <button
            onClick={onClose}
            title="Cerrar"
            className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95 flex items-center justify-center ml-2"
          >
            <X className="w-7 h-7 stroke-[3px]" />
          </button>
        </div>

        {/* Modal Body Blanco */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col min-h-0 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

