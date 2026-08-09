import React from 'react';
import { useBar } from '../../context/BarContext';
import { DollarSign, Receipt, ShoppingCart, Archive, Users, DollarSign as DollarIcon, RefreshCcw, TrendingUp } from 'lucide-react';

export const AdminDashboard = () => {
  const { paidInvoices, products, cashRegisterHistory, users, exchangeRate, updateExchangeRate } = useBar();

  // Cálculo histórico total (cierres pasados + turno actual)
  const pastInvoices = cashRegisterHistory.flatMap(c => c.invoices || []);
  const allInvoices = [...paidInvoices, ...pastInvoices];

  const totalHistoricalSales = allInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCashSales = allInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCardSales = allInvoices.filter(i => i.paymentMethod !== 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

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

  return (
    <div className="space-y-6">

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

        {/* Panel de Alertas de Stock Urgentes */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 m-0 flex items-center justify-between">
            <span>Productos por Agotarse (Inventario Crítico)</span>
            <span className="text-xs text-amber-600 font-semibold">{lowStockProducts.length} productos bajo su límite</span>
          </h3>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay productos en nivel crítico de inventario.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {lowStockProducts.map(prod => (
                <div key={prod.id} className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-amber-900 m-0">{prod.name}</h4>
                    <p className="text-amber-700 text-[11px] m-0 mt-0.5">Categoría: {prod.category}</p>
                  </div>
                  <span className="bg-amber-600 text-white font-extrabold px-2.5 py-1 rounded-lg">
                    Stock: {prod.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
