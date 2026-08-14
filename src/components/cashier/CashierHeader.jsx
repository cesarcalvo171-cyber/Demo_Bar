import React from 'react';
import { LogOut, User, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { FaCashRegister } from "react-icons/fa";
import { useBar } from '../../context/BarContext';

export const CashierHeader = () => {
  const { currentUser, logout, isOnline, pendingSyncCount, syncOfflineQueue } = useBar();

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-20 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Titulo del Sistema */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-amber-500 text-slate-900 p-1.5 sm:p-2 rounded-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
            <FaCashRegister className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold font-serif tracking-tight text-white m-0 truncate">
              Caja <span className="text-amber-400 font-sans text-xs sm:text-sm font-bold bg-amber-500/10 px-2 py-0.5 rounded-full ml-1 border border-amber-500/20">Turno Activo</span>
            </h1>
          </div>
        </div>

        {/* Estado de Conexión, Usuario Activo y Cerrar Sesión */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Badge de Conexión Offline / Online */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/50 text-red-300 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span>Offline {pendingSyncCount > 0 && `(${pendingSyncCount})`}</span>
            </div>
          ) : pendingSyncCount > 0 ? (
            <button
              onClick={syncOfflineQueue}
              className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-amber-900 cursor-pointer transition-colors"
              title="Click para sincronizar ahora"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Sincronizando ({pendingSyncCount})</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>En Línea</span>
            </div>
          )}

          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-bold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded uppercase">
                {currentUser.role}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-red-600/90 hover:bg-red-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
