import React from 'react';
import { Shield, LogOut, User } from 'lucide-react';
import { useBar } from '../../context/BarContext';
import logo from "../../assets/Imagenes/logo.png";

export const AdminHeader = () => {
  const { currentUser, logout } = useBar();

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Titulo del Sistema */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center shrink-0">
            <img src={logo} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold font-serif tracking-tight text-white m-0 truncate">
              Moncho's Bar <span className="text-yellow-500 font-sans text-xs sm:text-sm font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full ml-1 border border-yellow-500/20">Admin</span>
            </h1>
          </div>
        </div>

        {/* Usuario Activo y Cerrar Sesión */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
