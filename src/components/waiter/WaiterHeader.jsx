import React from 'react';
import { Utensils, LogOut, User } from 'lucide-react';
import { useBar } from '../../context/BarContext';

export const WaiterHeader = () => {
  const { currentUser, logout } = useBar();

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Titulo del Sistema */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-900 p-2 rounded-lg font-bold flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold font-serif tracking-tight text-white m-0">Panel de Mesas</h1>
          </div>
        </div>

        {/* Usuario Activo y Cerrar Sesión */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-bold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded uppercase">
                {currentUser.role}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
