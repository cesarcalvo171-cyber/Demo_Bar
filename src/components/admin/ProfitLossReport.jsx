import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { INITIAL_PRODUCTS } from '../../mock/initialData';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Briefcase, 
  Activity, 
  X, 
  Layers, 
  Package, 
  UtensilsCrossed, 
  Clock 
} from 'lucide-react';

export const ProfitLossReport = () => {
  const { paidInvoices, cashRegisterHistory, expenses, products, categories, tables } = useBar();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showLiveModal, setShowLiveModal] = useState(false);

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
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  // 2. Costo de Mercadería Vendida (COGS)
  const totalCOGS = filteredInvoices.reduce((sum, inv) => {
    const invoiceCost = (inv.items || []).reduce((itemSum, item) => {
      let itemCost = Number(item.cost || item.product?.cost || 0);
      if (!itemCost && item.name && products && products.length > 0) {
        const prodMatch = products.find(
          (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );
        if (prodMatch && prodMatch.cost) {
          itemCost = Number(prodMatch.cost);
        }
      }
      return itemSum + itemCost * (Number(item.quantity) || 1);
    }, 0);
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

  // --- CÁLCULOS EN VIVO (TURNO ACTUAL) PARA EL MODAL ---
  const liveShiftSales = paidInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const liveShiftCash = paidInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const liveShiftCard = paidInvoices.filter(i => i.paymentMethod !== 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  // Mesas Ocupadas y Dinero en Consumo Activo
  const occupiedTables = (tables || []).filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago' || (t.items && t.items.length > 0));
  const activeConsumptionTotal = occupiedTables.reduce((sum, table) => {
    const tableTotal = (table.items || []).reduce((tSum, item) => tSum + (Number(item.product?.price || item.price || 0) * (Number(item.quantity) || 1)), 0);
    return sum + tableTotal;
  }, 0);

  // Función robusta para resolver nombre de categoría exacto
  const resolveCategoryName = (prodName, itemCategory) => {
    const cleanName = (prodName || '').trim().toLowerCase();
    
    // 1. Buscar en catálogo
    const matchedProd = (products || []).find(
      p => p.name?.trim().toLowerCase() === cleanName
    ) || (INITIAL_PRODUCTS || []).find(
      p => p.name?.trim().toLowerCase() === cleanName
    );

    let rawCat = matchedProd?.category || itemCategory;

    // 2. Si es General o undefined, clasificar por palabras clave
    if (!rawCat || rawCat.toLowerCase() === 'general') {
      if (cleanName.includes('toña') || cleanName.includes('clasica') || cleanName.includes('spark') || cleanName.includes('heineken') || cleanName.includes('miller') || cleanName.includes('sol') || cleanName.includes('bambu') || cleanName.includes('smirnof') || cleanName.includes('corona') || cleanName.includes('victoria') || cleanName.includes('cerveza')) {
        rawCat = 'cervezas';
      } else if (cleanName.includes('nachos') || cleanName.includes('alitas') || cleanName.includes('salchipapa') || cleanName.includes('hamburguesa') || cleanName.includes('hot dog') || cleanName.includes('consume') || cleanName.includes('toston') || cleanName.includes('comida') || cleanName.includes('papas')) {
        rawCat = 'comida';
      } else if (cleanName.includes('reserva') || cleanName.includes('lite') || cleanName.includes('plata') || cleanName.includes('ron') || cleanName.includes('licor') || cleanName.includes('vodka') || cleanName.includes('trago') || cleanName.includes('whisky')) {
        rawCat = 'licores';
      } else if (cleanName.includes('chubby') || cleanName.includes('gatorade') || cleanName.includes('power') || cleanName.includes('agua') || cleanName.includes('pepsi') || cleanName.includes('lipton') || cleanName.includes('soda') || cleanName.includes('jugo')) {
        rawCat = 'Bebida sin alcohol';
      } else if (cleanName.includes('chiveria') || cleanName.includes('snack') || cleanName.includes('mani')) {
        rawCat = 'chiveria';
      } else {
        rawCat = 'General';
      }
    }

    // 3. Formatear nombre visual
    const catObj = (categories || []).find(
      c => c.id?.toLowerCase() === rawCat.toLowerCase() || c.name?.toLowerCase() === rawCat.toLowerCase()
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

  // Desglose de Categorías y Productos del Turno en Vivo
  const liveCatMap = {};
  const liveProdMap = {};

  paidInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const total = price * qty;
      const prodName = (item.name || 'Producto').trim();
      const catName = resolveCategoryName(prodName, item.category);

      // Categorías
      if (!liveCatMap[catName]) {
        liveCatMap[catName] = { name: catName, totalAmount: 0, totalUnits: 0 };
      }
      liveCatMap[catName].totalAmount += total;
      liveCatMap[catName].totalUnits += qty;

      // Productos
      if (!liveProdMap[prodName]) {
        liveProdMap[prodName] = {
          name: prodName,
          category: catName,
          quantity: 0,
          totalAmount: 0,
        };
      }
      liveProdMap[prodName].quantity += qty;
      liveProdMap[prodName].totalAmount += total;
    });
  });

  const liveCategoryList = Object.values(liveCatMap).sort((a, b) => b.totalAmount - a.totalAmount);
  const liveProductList = Object.values(liveProdMap).sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="space-y-4 sm:space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 m-0">Estado de Resultados (P&L)</h2>
          <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Rentabilidad real del negocio (Ingresos vs Costos y Gastos).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Botón de Ingresos en Vivo */}
          <button
            onClick={() => setShowLiveModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
          Ventas en tiempo Real
          </button>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="flex-1 sm:flex-none p-2.5 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer shadow-xs"
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
            className="flex-1 sm:flex-none p-2.5 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer shadow-xs"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
            <DollarSign className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase m-0">Ventas Totales</h3>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 m-0">C${totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-tight">Facturación cobrada en el período.</p>
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
              Por cada Córdoba que vendes, te quedan <strong>{(totalRevenue > 0 ? (netProfit / totalRevenue) : 0).toFixed(2)} centavos</strong> 
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DE INGRESOS EN VIVO (TURNO ACTUAL) */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            
            {/* Header del Modal */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b border-slate-800">
              <div>
               
                <h3 className="text-xl font-black m-0 mt-1 flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Ingresos en Vivo (Turno Actual)
                </h3>
              </div>
              <button
                onClick={() => setShowLiveModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Tarjetas de Métricas en Vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Total Ingresado en Caja</span>
                  <h4 className="text-2xl font-black text-emerald-900 m-0 mt-0.5">C${liveShiftSales.toFixed(2)}</h4>
                  <span className="text-xs text-emerald-700 font-bold">{paidInvoices.length} facturas pagadas</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Cobrado en Efectivo</span>
                  <h4 className="text-2xl font-black text-slate-800 m-0 mt-0.5">C${liveShiftCash.toFixed(2)}</h4>
                  <span className="text-xs text-slate-500 font-medium">En gaveta de caja</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">Tarjeta / Transferencias</span>
                  <h4 className="text-2xl font-black text-blue-900 m-0 mt-0.5">C${liveShiftCard.toFixed(2)}</h4>
                  <span className="text-xs text-blue-700 font-medium">Bancos / Vouchers</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">En Consumo (Mesas)</span>
                  <h4 className="text-2xl font-black text-amber-900 m-0 mt-0.5">C${activeConsumptionTotal.toFixed(2)}</h4>
                  <span className="text-xs text-amber-700 font-bold">{occupiedTables.length} mesas por cobrar</span>
                </div>
              </div>

              {/* Ventas por Categoría en Vivo */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Ventas por Categoría en Tiempo Real ({liveCategoryList.length})
                </h4>

                {liveCategoryList.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    No se han registrado ventas en el turno actual todavía.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {liveCategoryList.map(cat => {
                      const isBeer = cat.name.includes('CERVEZA');
                      const isFood = cat.name.includes('COMIDA');
                      const isLiquor = cat.name.includes('LICOR');
                      const isSnack = cat.name.includes('CHIVERIA') || cat.name.includes('CHIVERÍA');

                      const borderBg = isBeer 
                        ? 'bg-amber-50/70 border-amber-200' 
                        : isFood 
                        ? 'bg-orange-50/70 border-orange-200' 
                        : isLiquor 
                        ? 'bg-purple-50/70 border-purple-200' 
                        : isSnack 
                        ? 'bg-emerald-50/70 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200';

                      const textColor = isBeer 
                        ? 'text-amber-800' 
                        : isFood 
                        ? 'text-orange-800' 
                        : isLiquor 
                        ? 'text-purple-800' 
                        : isSnack 
                        ? 'text-emerald-800' 
                        : 'text-slate-700';

                      return (
                        <div key={cat.name} className={`${borderBg} border p-4 rounded-2xl shadow-xs transition-all`}>
                          <span className={`text-[10px] font-black uppercase tracking-wider block ${textColor}`}>
                            {cat.name}
                          </span>
                          <p className="text-xl font-black text-slate-900 m-0 mt-1">C${cat.totalAmount.toFixed(2)}</p>
                          <span className="text-xs font-bold text-slate-500 mt-0.5 block">{cat.totalUnits} unidades vendidas</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lista Detallada de Productos Vendidos en el Turno */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  Productos Despachados en este Turno ({liveProductList.length})
                </h4>

                {liveProductList.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    Aún no hay productos vendidos en este turno.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Producto</th>
                          <th className="py-3 px-4">Categoría</th>
                          <th className="py-3 px-4 text-center">Unidades Vendidas</th>
                          <th className="py-3 px-4 text-right">Monto Recaudado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {liveProductList.map(prod => {
                          const isBeer = prod.category.includes('CERVEZA');
                          const isFood = prod.category.includes('COMIDA');
                          const isLiquor = prod.category.includes('LICOR');
                          const isSnack = prod.category.includes('CHIVERIA') || prod.category.includes('CHIVERÍA');

                          const badgeClass = isBeer 
                            ? 'bg-amber-100 text-amber-900 border-amber-200' 
                            : isFood 
                            ? 'bg-orange-100 text-orange-900 border-orange-200' 
                            : isLiquor 
                            ? 'bg-purple-100 text-purple-900 border-purple-200' 
                            : isSnack 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200' 
                            : 'bg-slate-100 text-slate-800 border-slate-200';

                          return (
                            <tr key={prod.name} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-bold text-slate-900">{prod.name}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeClass}`}>
                                  {prod.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-black text-slate-800">
                                {prod.quantity}
                              </td>
                              <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                                C${prod.totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowLiveModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Cerrar Monitor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
