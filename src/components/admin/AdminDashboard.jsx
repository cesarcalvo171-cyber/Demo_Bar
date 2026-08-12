import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { DollarSign, Receipt, ShoppingCart, Archive, Users, DollarSign as DollarIcon, RefreshCcw, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminDashboard = () => {
  const { paidInvoices, products, cashRegisterHistory, users, exchangeRate, updateExchangeRate } = useBar();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Cálculo histórico total (cierres pasados + turno actual)
  const pastInvoices = cashRegisterHistory.flatMap(c => c.invoices || []);
  const allInvoices = [...paidInvoices, ...pastInvoices];

  const totalHistoricalSales = allInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCashSales = allInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCardSales = allInvoices.filter(i => i.paymentMethod !== 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  // Límite de stock mínimo para alertas por categoría
  const getLowStockThreshold = (category) => {
    switch (category?.toLowerCase()) {
      case 'cervezas': return 45;
      case 'licores': return 5;
      case 'bebida sin alcohol': return 10;
      default: return 10;
    }
  };

  // Productos con bajo stock que sí manejan inventario
  const lowStockProducts = products.filter(p => {
    if (p.stock === null) return false;
    const threshold = getLowStockThreshold(p.category);
    return p.stock <= threshold;
  });

  const totalPages = Math.max(1, Math.ceil(lowStockProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const displayedProducts = lowStockProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 font-sans">

      {/* Tarjetas Principales del Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Tasa de Cambio */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2">
            <DollarIcon className="w-5 h-5 text-yellow-500" />
            <p className="text-[14px] font-semibold text-yellow-500 uppercase tracking-wider m-0">Tasa de Cambio</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">C$</span>
            <input 
              type="number" 
              value={exchangeRate || ''}
              onChange={(e) => updateExchangeRate(e.target.value)}
              step="0.01"
              className="w-full bg-slate-800 text-white font-bold px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="Ej. 36.62"
            />
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="text-yellow-500 p-3">
            <DollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-yellow-500 uppercase tracking-wider m-0">Ventas Históricas</p>
            <h3 className="text-xl font-extrabold text-white m-0">C${totalHistoricalSales.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="text-yellow-500 p-3">
            <Users className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-yellow-500 uppercase tracking-wider m-0">Personal Activo</p>
            <h3 className="text-xl font-extrabold text-white m-0">{users.length} usuarios</h3>
          </div>
        </div>
      </div>

      {/* Fila 2: Desglose de Pagos y Alertas de Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen Financiero Efectivo vs Tarjeta */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 m-0">
            Balance General de Métodos de Pago
          </h3>

          <div className="space-y-3">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase block">Total Efectivo Ingresado</span>
                <span className="text-xl font-extrabold text-emerald-900">C${totalCashSales.toFixed(2)}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {totalHistoricalSales > 0 ? ((totalCashSales / totalHistoricalSales) * 100).toFixed(0) : 0}%
              </span>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase block">Total Tarjetas / Vouchers</span>
                <span className="text-xl font-extrabold text-blue-900">C${totalCardSales.toFixed(2)}</span>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                {totalHistoricalSales > 0 ? ((totalCardSales / totalHistoricalSales) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Panel de Alertas de Stock Urgentes con Paginación de 10 */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                Productos por Agotarse (Inventario Crítico)
              </h3>
              <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                {lowStockProducts.length} productos bajo su límite
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay productos en nivel crítico de inventario.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {displayedProducts.map(prod => (
                  <div key={prod.id} className="bg-amber-50/80 hover:bg-amber-50 border border-amber-200/90 p-3.5 rounded-xl flex justify-between items-center text-xs transition-colors">
                    <div className="pr-2 truncate">
                      <h4 className="font-bold text-amber-950 m-0 truncate">{prod.name}</h4>
                      <p className="text-amber-700 text-[11px] m-0 mt-0.5 capitalize">Categoría: {prod.category}</p>
                    </div>
                    <span className="bg-amber-600 text-white font-black px-2.5 py-1 rounded-lg shrink-0 text-xs shadow-2xs">
                      Stock: {prod.stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controles de Paginación "Ver Siguientes" / "Ver Anteriores" */}
          {lowStockProducts.length > ITEMS_PER_PAGE && (
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium order-2 sm:order-1">
                Mostrando <strong className="text-slate-800">{startIndex + 1}</strong> - <strong className="text-slate-800">{Math.min(startIndex + ITEMS_PER_PAGE, lowStockProducts.length)}</strong> de <strong className="text-slate-800">{lowStockProducts.length}</strong> productos
              </span>

              <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anteriores</span>
                </button>

                <span className="px-2.5 py-1 bg-slate-100 rounded-md font-extrabold text-slate-700 text-[11px]">
                  {safePage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs text-xs"
                >
                  <span>Siguientes</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
