import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Briefcase, Activity } from 'lucide-react';

export const ProfitLossReport = () => {
  const { paidInvoices, cashRegisterHistory, expenses } = useBar();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Consolidar todas las facturas (cierres pasados + facturas actuales)
  const pastInvoices = cashRegisterHistory.flatMap(c => c.invoices || []);
  const allInvoices = [...paidInvoices, ...pastInvoices];

  // Filtrar facturas por mes y año
  const filteredInvoices = allInvoices.filter(inv => {
    const d = new Date(inv.fullDate);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  // Filtrar gastos por mes y año
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  // 1. Ingresos Brutos (Ventas Totales)
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // 2. Costo de Mercadería Vendida (COGS)
  const totalCOGS = filteredInvoices.reduce((sum, inv) => {
    const invoiceCost = inv.items.reduce((itemSum, item) => itemSum + ((item.cost || 0) * item.quantity), 0);
    return sum + invoiceCost;
  }, 0);

  // 3. Ganancia Bruta (Gross Profit)
  const grossProfit = totalRevenue - totalCOGS;

  // 4. Gastos Operativos (Se EXCLUYE 'compras' porque eso es inventario, el gasto real está en el COGS)
  const operationalExpenses = filteredExpenses.filter(e => e.category !== 'compras');
  
  const totalOpExpenses = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expensesByCat = operationalExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  // 5. Ganancia Neta (Net Profit)
  const netProfit = grossProfit - totalOpExpenses;
  const isProfitable = netProfit >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 m-0">Estado de Resultados (P&L)</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">Rentabilidad real de tu negocio (Ingresos vs Costos y Gastos Operativos).</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value={0}>Enero</option>
            <option value={1}>Febrero</option>
            <option value={2}>Marzo</option>
            <option value={3}>Abril</option>
            <option value={4}>Mayo</option>
            <option value={5}>Junio</option>
            <option value={6}>Julio</option>
            <option value={7}>Agosto</option>
            <option value={8}>Septiembre</option>
            <option value={9}>Octubre</option>
            <option value={10}>Noviembre</option>
            <option value={11}>Diciembre</option>
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <DollarSign className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase m-0">Ventas Totales</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 m-0">C${totalRevenue.toFixed(2)}</p>
        </div>
        
        <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-rose-700">
            <Receipt className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase m-0">Costo de Mercadería</h3>
          </div>
          <p className="text-2xl font-black text-rose-900 m-0">C${totalCOGS.toFixed(2)}</p>
          <p className="text-[10px] text-rose-600 font-semibold mt-1 leading-tight">Costo de los productos que vendiste este mes.</p>
        </div>

        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-700">
            <Briefcase className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase m-0">Gastos Operativos</h3>
          </div>
          <p className="text-2xl font-black text-amber-900 m-0">C${totalOpExpenses.toFixed(2)}</p>
          <p className="text-[10px] text-amber-600 font-semibold mt-1 leading-tight">Servicios, planillas y otros gastos.</p>
        </div>

        <div className={`${isProfitable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} p-5 rounded-xl border shadow-sm`}>
          <div className={`flex items-center gap-2 mb-2 ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
            <Activity className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase m-0">Ganancia Neta</h3>
          </div>
          <p className={`text-2xl font-black m-0 flex items-center gap-2 ${isProfitable ? 'text-emerald-900' : 'text-red-900'}`}>
            C${netProfit.toFixed(2)}
            {isProfitable ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-200">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            Desglose Financiero
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-700">Ingresos por Ventas</span>
              <span className="font-bold text-slate-900">C${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-rose-600">
              <span>(-) Costo de Mercadería Vendida</span>
              <span>- C${totalCOGS.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-black text-slate-800">
              <span>= Ganancia Bruta</span>
              <span>C${grossProfit.toFixed(2)}</span>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Gastos Operativos</span>
              <div className="pl-4 mt-2 space-y-2 text-sm text-amber-700">
                <div className="flex justify-between items-center">
                  <span>Planilla / Trabajadores</span>
                  <span>- C${(expensesByCat['planilla'] || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Servicios (Luz, Agua, etc.)</span>
                  <span>- C${(expensesByCat['servicios'] || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Otros Gastos</span>
                  <span>- C${(expensesByCat['otros'] || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-lg font-black">
              <span className={isProfitable ? 'text-emerald-700' : 'text-red-700'}>= Ganancia Neta</span>
              <span className={isProfitable ? 'text-emerald-700' : 'text-red-700'}>
                C${netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 bg-slate-50 flex flex-col justify-center">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg ${
              isProfitable ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-600'
            }`}>
              {isProfitable ? <TrendingUp className="w-10 h-10 text-white" /> : <TrendingDown className="w-10 h-10 text-white" />}
            </div>
            <h4 className="text-xl font-black text-slate-800 m-0">Margen de Rentabilidad</h4>
            <p className="text-4xl font-black text-slate-900 mt-2 mb-0">
              {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-slate-500 mt-3 max-w-xs mx-auto">
              Por cada Córdoba que vendes, te quedan <strong>{(totalRevenue > 0 ? (netProfit / totalRevenue) : 0).toFixed(2)} centavos</strong> libres de polvo y paja después de pagar el producto y la operación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
