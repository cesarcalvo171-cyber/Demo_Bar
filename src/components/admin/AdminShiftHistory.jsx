import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Calendar, DollarSign, Archive, ChevronDown, ChevronUp, Receipt, Printer, Package, Layers, TrendingUp } from 'lucide-react';
import { printShiftCloseReceipt } from '../../utils/printShiftReceipt';

import { INITIAL_PRODUCTS } from '../../mock/initialData';

export const AdminShiftHistory = () => {
  const { cashRegisterHistory, products, categories } = useBar();
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
      acumuladoDelMes += (Number(shift.totalSales) || 0);
    }
    if (shiftDay === currentDayStr) {
      ventasDelDia += (Number(shift.totalSales) || 0);
    }
  });

  // Agrupar cierres por mes
  const groupedByMonth = cashRegisterHistory.reduce((acc, shift) => {
    const month = getMonthYear(shift.endTime);
    if (!acc[month]) acc[month] = [];
    acc[month].push(shift);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedByMonth);

  // Resolver nombre de categoría exacto sin comodín General
  const resolveCategoryName = (prodName, itemCategory) => {
    const cleanName = (prodName || '').trim().toLowerCase();

    const matchedProd =
      (products || []).find((p) => p.name?.trim().toLowerCase() === cleanName) ||
      (INITIAL_PRODUCTS || []).find((p) => p.name?.trim().toLowerCase() === cleanName);

    let rawCat = matchedProd?.category || itemCategory;

    if (!rawCat || rawCat.toLowerCase() === 'general') {
      if (
        cleanName.includes('toña') ||
        cleanName.includes('clasica') ||
        cleanName.includes('spark') ||
        cleanName.includes('heineken') ||
        cleanName.includes('miller') ||
        cleanName.includes('sol') ||
        cleanName.includes('bambu') ||
        cleanName.includes('smirnof') ||
        cleanName.includes('corona')
      ) {
        rawCat = 'cervezas';
      } else if (
        cleanName.includes('nachos') ||
        cleanName.includes('alitas') ||
        cleanName.includes('salchipapa') ||
        cleanName.includes('hamburguesa') ||
        cleanName.includes('hot dog') ||
        cleanName.includes('consume') ||
        cleanName.includes('toston')
      ) {
        rawCat = 'comida';
      } else if (
        cleanName.includes('reserva') ||
        cleanName.includes('lite') ||
        cleanName.includes('plata') ||
        cleanName.includes('ron') ||
        cleanName.includes('licor') ||
        cleanName.includes('vodka') ||
        cleanName.includes('whisky')
      ) {
        rawCat = 'licores';
      } else if (
        cleanName.includes('chovi') ||
        cleanName.includes('chubby') ||
        cleanName.includes('gatorade') ||
        cleanName.includes('power') ||
        cleanName.includes('agua') ||
        cleanName.includes('pepsi') ||
        cleanName.includes('ensa') ||
        cleanName.includes('lipton')
      ) {
        rawCat = 'Bebida sin alcohol';
      } else if (cleanName.includes('cubetazo') || cleanName.includes('promo')) {
        rawCat = 'promociones';
      } else {
        rawCat = 'General';
      }
    }

    const catObj = (categories || []).find(
      (c) => c.id?.toLowerCase() === rawCat.toLowerCase() || c.name?.toLowerCase() === rawCat.toLowerCase()
    );

    const baseName = catObj?.name || rawCat;
    const lower = baseName.toLowerCase();

    if (lower === 'comida' || lower === 'comidas') return 'COMIDAS';
    if (lower === 'cervezas' || lower === 'cerveza') return 'CERVEZAS';
    if (lower === 'licores' || lower === 'licor') return 'LICORES';
    if (lower.includes('bebida')) return 'BEBIDAS SIN ALCOHOL';
    if (lower === 'chiveria' || lower === 'chivería') return 'CHIVERÍA';
    if (lower === 'promociones') return 'PROMOCIONES';
    return baseName.toUpperCase();
  };

  // Función para obtener unidades físicas reales (ej. 1 Cubetazo = 6 cervezas)
  const getPhysicalUnits = (prodName, qty, matchedProd) => {
    const cleanName = (prodName || '').toLowerCase();
    const numQty = Number(qty) || 1;

    if (matchedProd?.bundleItems && Array.isArray(matchedProd.bundleItems) && matchedProd.bundleItems.length > 0) {
      const totalInBundle = matchedProd.bundleItems.reduce((s, b) => s + (Number(b.quantity) || 1), 0);
      return numQty * totalInBundle;
    }

    if (cleanName.includes('cubetazo') || cleanName.includes('cubetazo toña') || cleanName.includes('cubetazo clasica') || cleanName.includes('cubetazo tona')) {
      return numQty * 6;
    }

    return numQty;
  };

  // Función para procesar métricas de un turno (categorías y stock)
  const getShiftMetrics = (invoices = []) => {
    const catMap = {};
    const prodMap = {};

    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const total = price * qty;
        const prodName = (item.name || 'Producto').trim();
        const catName = resolveCategoryName(prodName, item.category);

        const matchedProd =
          (products || []).find((p) => p.name?.trim().toLowerCase() === prodName.toLowerCase()) ||
          (INITIAL_PRODUCTS || []).find((p) => p.name?.trim().toLowerCase() === prodName.toLowerCase());

        const physicalUnits = getPhysicalUnits(prodName, qty, matchedProd);

        // Categoría
        if (!catMap[catName]) {
          catMap[catName] = { name: catName, totalAmount: 0, totalUnits: 0 };
        }
        catMap[catName].totalAmount += total;
        catMap[catName].totalUnits += physicalUnits;

        // Calcular stock para la auditoría (incluyendo promociones/cubetazos)
        let stockDisplay = 'Cocina';
        let displayName = prodName;

        if (prodName.toLowerCase().includes('cubetazo toña') || prodName.toLowerCase().includes('cubetazo tona')) {
          displayName = 'CUBETAZO TOÑA (x6 bot.)';
          const tonaProd = (products || []).find(p => p.name?.toLowerCase().includes('toña 12') || p.id === 1);
          stockDisplay = tonaProd && tonaProd.stock !== null ? `${tonaProd.stock} Toña` : '110 Toña';
        } else if (prodName.toLowerCase().includes('cubetazo clasica')) {
          displayName = 'CUBETAZO CLASICA (x6 bot.)';
          const clasicaProd = (products || []).find(p => p.name?.toLowerCase().includes('clasica 12') || p.id === 4);
          stockDisplay = clasicaProd && clasicaProd.stock !== null ? `${clasicaProd.stock} Clásica` : '6 Clásicas';
        } else if (matchedProd && matchedProd.stock !== null && matchedProd.category !== 'comida') {
          stockDisplay = `${matchedProd.stock} unid.`;
        }

        // Producto
        if (!prodMap[displayName]) {
          prodMap[displayName] = {
            name: displayName,
            category: catName,
            quantitySold: 0,
            currentStock: stockDisplay,
          };
        }
        prodMap[displayName].quantitySold += physicalUnits;
        prodMap[displayName].currentStock = stockDisplay;
      });
    });

    return {
      categoryList: Object.values(catMap).sort((a, b) => b.totalAmount - a.totalAmount),
      productList: Object.values(prodMap).sort((a, b) => b.quantitySold - a.quantitySold),
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Dashboard Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Ventas del Día */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider m-0">Ventas del Día ({currentDayStr})</p>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white m-0">C${ventasDelDia.toFixed(2)}</h3>
        </div>

        {/* Acumulado del Mes */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider m-0">Acumulado {currentMonthStr}</p>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white m-0">C${acumuladoDelMes.toFixed(2)}</h3>
        </div>
      </div>

      {/* Historial Mes a Mes */}
      <div className="space-y-6 sm:space-y-8 mt-6">
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
                {groupedByMonth[month].map(shift => {
                  const isExpanded = expandedShift === shift.id;
                  const { categoryList, productList } = isExpanded ? getShiftMetrics(shift.invoices) : { categoryList: [], productList: [] };

                  return (
                    <div key={shift.id} className="p-4 sm:p-6 transition-colors hover:bg-slate-50/50">
                      <div 
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedShift(isExpanded ? null : shift.id)}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              {getDay(shift.endTime)}
                            </span>
                            <span className="text-slate-400 text-xs font-semibold">
                              {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-800 m-0">Turno de {shift.cashierName || 'Cajero'}</h4>
                          <p className="text-xs text-slate-500 m-0 mt-1">{shift.invoices.length} facturas emitidas</p>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide m-0 mb-0.5">Venta Total</p>
                            <p className="text-lg font-black text-emerald-600 m-0">C${shift.totalSales.toFixed(2)}</p>
                          </div>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Desplegable Completo del Turno */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-2">
                          
                          {/* Resumen Financiero y Botón de Reimpresión */}
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl text-white">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase m-0">Efectivo Total</p>
                                <p className="text-base sm:text-lg font-black text-emerald-400 m-0">C${shift.totalCash.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase m-0">Tarjeta / Transf.</p>
                                <p className="text-base sm:text-lg font-black text-blue-400 m-0">C${shift.totalCard.toFixed(2)}</p>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase m-0">Venta Total</p>
                                <p className="text-base sm:text-lg font-black text-yellow-400 m-0">C${shift.totalSales.toFixed(2)}</p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                printShiftCloseReceipt({
                                  invoices: shift.invoices,
                                  cashierName: shift.cashierName || 'Cajero Principal',
                                  startTime: shift.startTime,
                                  endTime: shift.endTime,
                                  products,
                                  categories,
                                  shiftId: shift.id,
                                });
                              }}
                              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 w-full sm:w-auto"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir Ticket Corte Z
                            </button>
                          </div>

                          {/* Ventas por Categorías */}
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Layers className="w-4 h-4 text-slate-400" />
                              Ventas por Categoría ({categoryList.length})
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                              {categoryList.map(cat => (
                                <div key={cat.name} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">{cat.name}</span>
                                  <p className="text-base font-black text-slate-900 m-0 mt-0.5">C${cat.totalAmount.toFixed(2)}</p>
                                  <span className="text-xs font-bold text-emerald-600">{cat.totalUnits} unidades vendidas</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Auditoría de Inventario: Vendido vs Stock Restante */}
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4 text-slate-400" />
                              Auditoría de Inventario (Vendido en Turno vs Stock Restante)
                            </h5>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                              <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-200">
                                    <tr>
                                      <th className="py-2.5 px-4">Producto</th>
                                      <th className="py-2.5 px-4 text-center">Unid. Vendidas</th>
                                      <th className="py-2.5 px-4 text-right">Stock Actual en Sistema</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {productList.map(prod => (
                                      <tr key={prod.name} className="hover:bg-slate-50/80">
                                        <td className="py-2.5 px-4 font-semibold text-slate-800">{prod.name}</td>
                                        <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                                          {prod.quantitySold}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-bold text-slate-600">
                                          {prod.currentStock}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Desglose de Facturas Individuales */}
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-slate-400" />
                              Facturas del Turno ({shift.invoices.length})
                            </h5>
                            
                            {shift.invoices.length === 0 ? (
                              <p className="text-sm text-slate-500 italic">No hubo facturas en este turno.</p>
                            ) : (
                              <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                                    <tr>
                                      <th className="py-2.5 px-4">Factura</th>
                                      <th className="py-2.5 px-4">Mesa / Barra</th>
                                      <th className="py-2.5 px-4">Método</th>
                                      <th className="py-2.5 px-4">Hora</th>
                                      <th className="py-2.5 px-4 text-right">Monto</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {shift.invoices.map(inv => (
                                      <tr key={inv.id} className="text-slate-600 hover:bg-slate-50">
                                        <td className="py-2.5 px-4 font-mono font-medium">{inv.id}</td>
                                        <td className="py-2.5 px-4 font-semibold">{inv.tableName}</td>
                                        <td className="py-2.5 px-4">
                                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                            inv.paymentMethod === 'Efectivo' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {inv.paymentMethod}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-400">{inv.date}</td>
                                        <td className="py-2.5 px-4 text-right font-black text-slate-900">C${inv.total.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
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
