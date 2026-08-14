import React from 'react';
import { Utensils, LogOut, User, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useBar } from '../../context/BarContext';

import logo from "../../assets/Imagenes/logo.png";

export const WaiterHeader = () => {
  const { currentUser, logout, isOnline, pendingSyncCount, syncOfflineQueue } = useBar();

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Titulo del Sistema */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full overflow-hidden w-10 h-10 flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <img src={logo} alt="Moncho Bar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold font-serif tracking-tight text-white m-0">Moncho's Bar</h1>
          </div>
        </div>

        {/* Estado de Conexión, Usuario Activo y Cerrar Sesión */}
        <div className="flex items-center gap-3">
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
