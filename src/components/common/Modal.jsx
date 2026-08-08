import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-5xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`bg-slate-950 rounded-2xl shadow-2xl w-full ${maxWidth} h-[92vh] max-h-[92vh] flex flex-col min-h-0 overflow-hidden border border-slate-700/80`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <h2 className="text-base sm:text-lg font-black font-inter text-white m-0 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-0 sm:p-4 lg:p-5 overflow-hidden flex-1 flex flex-col min-h-0 bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};
