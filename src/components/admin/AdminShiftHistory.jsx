import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Calendar, DollarSign, Archive, ChevronDown, ChevronUp, Receipt } from 'lucide-react';

export const AdminShiftHistory = () => {
  const { cashRegisterHistory } = useBar();
  const [expandedShift, setExpandedShift] = useState(null);

  // Funciones de utilidad para fechas
  const getMonthYear = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-NI', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const getDay = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Calcular métricas globales actuales (Día y Mes)
  const now = new Date();
  const currentMonthStr = getMonthYear(now.toISOString());
  const currentDayStr = getDay(now.toISOString());

  let ventasDelDia = 0;
  let acumuladoDelMes = 0;

  cashRegisterHistory.forEach(shift => {
    const shiftMonth = getMonthYear(shift.endTime);
    const shiftDay = getDay(shift.endTime);
    
    if (shiftMonth === currentMonthStr) {
      acumuladoDelMes += shift.totalSales;
    }
    if (shiftDay === currentDayStr) {
      ventasDelDia += shift.totalSales;
    }
  });

  // Agrupar cierres por mes
  const groupedByMonth = cashRegisterHistory.reduce((acc, shift) => {
    const month = getMonthYear(shift.endTime);
    if (!acc[month]) acc[month] = [];
    acc[month].push(shift);
    return acc;
  }, {});

  // Ordenar meses (esto es simple ya que asume inserción, pero en la vida real se ordena por fecha)
  const sortedMonths = Object.keys(groupedByMonth); // El historial ya viene ordenado de más nuevo a viejo por context

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Dashboard Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ventas del Día */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider m-0">Ventas del Día ({currentDayStr})</p>
          </div>
          <h3 className="text-4xl font-black text-white m-0">C${ventasDelDia.toFixed(2)}</h3>
        </div>

        {/* Acumulado del Mes */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <TrendingUpIcon />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider m-0">Acumulado {currentMonthStr}</p>
          </div>
          <h3 className="text-4xl font-black text-white m-0">C${acumuladoDelMes.toFixed(2)}</h3>
        </div>
      </div>

      {/* Historial Mes a Mes */}
      <div className="space-y-8 mt-8">
        {sortedMonths.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
            <Archive className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 m-0">No hay cierres de caja aún</h3>
            <p className="text-slate-500 mt-2">Los cierres realizados por los cajeros aparecerán aquí organizados por mes y día.</p>
          </div>
        ) : (
          sortedMonths.map(month => (
            <div key={month} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header del Mes */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 m-0 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  {month}
                </h3>
                <div className="text-sm font-bold text-slate-600">
                  Total del mes: <span className="text-emerald-600 font-black">C${groupedByMonth[month].reduce((sum, s) => sum + s.totalSales, 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Lista de Cierres (Días) */}
              <div className="divide-y divide-slate-100">
                {groupedByMonth[month].map(shift => (
                  <div key={shift.id} className="p-4 sm:p-6 transition-colors hover:bg-slate-50/50">
                    <div 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {getDay(shift.endTime)}
                          </span>
                          <span className="text-slate-400 text-xs font-semibold">{new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 m-0">Turno de {shift.cashierName}</h4>
                        <p className="text-xs text-slate-500 m-0 mt-1">{shift.invoices.length} facturas emitidas</p>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide m-0 mb-0.5">Venta Total</p>
                          <p className="text-lg font-black text-emerald-600 m-0">C${shift.totalSales.toFixed(2)}</p>
                        </div>
                        <div className="text-slate-400">
                          {expandedShift === shift.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Desplegable de Facturas */}
                    {expandedShift === shift.id && (
                      <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Efectivo Total</p>
                            <p className="text-sm font-bold text-slate-700 m-0">C${shift.totalCash.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tarjeta/Transf. Total</p>
                            <p className="text-sm font-bold text-slate-700 m-0">C${shift.totalCard.toFixed(2)}</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">ID Cierre</p>
                            <p className="text-xs font-mono text-slate-500 m-0">{shift.id}</p>
                          </div>
                        </div>

                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-slate-400" />
                          Desglose de Facturas ({shift.invoices.length})
                        </h5>
                        
                        {shift.invoices.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No hubo facturas en este turno.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                  <th className="pb-2 font-semibold">Factura</th>
                                  <th className="pb-2 font-semibold">Mesa</th>
                                  <th className="pb-2 font-semibold">Método</th>
                                  <th className="pb-2 font-semibold">Hora</th>
                                  <th className="pb-2 font-semibold text-right">Monto</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {shift.invoices.map(inv => (
                                  <tr key={inv.id} className="text-slate-600 hover:bg-slate-50">
                                    <td className="py-2 font-medium">{inv.id}</td>
                                    <td className="py-2">{inv.tableName}</td>
                                    <td className="py-2">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        inv.paymentMethod === 'Efectivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {inv.paymentMethod}
                                      </span>
                                    </td>
                                    <td className="py-2 text-slate-400">{inv.date}</td>
                                    <td className="py-2 text-right font-bold text-slate-800">C${inv.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Icono Helper
function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );
}
