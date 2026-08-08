import React from 'react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-black via-yellow-900 to-yellow-700 text-xs py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Lado Izquierdo: Nombre de la Empresa */}
        <div className="flex items-center gap-2 text-[12px] "> 
          <span className="font-bold text-white">Zorix Pos</span>
          <span className="text-white">|</span>
          <span  className="text-white">Todos los derechos reservados © {currentYear}</span>
        </div>

        {/* Lado Derecho: Desarrollador / Versión */}
        <div className="flex items-center gap-3 text-[12px] text-white">
        
          <span className="text-white">•</span>
          <span>Desarrollado por <strong className="text-white font-semibold">Jobitx</strong></span>
        </div>
      </div>
    </footer>
  );
};