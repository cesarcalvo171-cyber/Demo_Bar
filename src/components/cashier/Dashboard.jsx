import React from 'react';
import { useBar } from '../../context/BarContext';
import { DollarSign, Receipt, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { printShiftCloseReceipt } from '../../utils/printShiftReceipt';

export const Dashboard = () => {
  const { paidInvoices, shiftStartTime, tables, closeShift, currentUser, products, categories, currentShiftId } = useBar();

  const totalInvoicesCount = paidInvoices.length;
  const totalCash = paidInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCard = paidInvoices.filter(i => i.paymentMethod !== 'Efectivo').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalSales = totalCash + totalCard;

  const activeTablesCount = tables.filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago').length;

  const handlePrintZReceipt = () => {
    printShiftCloseReceipt({
      invoices: paidInvoices,
      cashierName: currentUser?.name || 'Cajero Principal',
      startTime: shiftStartTime,
      endTime: new Date(),
      products,
      categories,
      shiftId: currentShiftId || '',
    });
  };

  const handleCloseShift = () => {
    if (activeTablesCount > 0) {
      alert(`No puedes cerrar caja. Hay ${activeTablesCount} mesa(s) abierta(s) o pendiente(s) de pago.`);
      return;
    }

    if (window.confirm('¿Estás seguro que deseas realizar el Cierre de Caja? Esto imprimirá el Corte Z completo (totales por categoría y auditoría de inventario), transferirá los datos al Administrador y pondrá la caja en C$0.00.')) {
      handlePrintZReceipt();
      closeShift();
      alert('Caja cerrada con éxito. ¡Buen turno!');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-sans">
      {/* Tarjetas de Métricas Principales (2 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Total Ventas del Día */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="text-yellow-500 p-2.5 sm:p-3 bg-yellow-500/10 rounded-xl">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider m-0">Ventas del Turno</p>
            <h3 className="text-xl sm:text-2xl font-black text-white m-0 mt-0.5">C${totalSales.toFixed(2)}</h3>
          </div>
        </div>

        {/* Facturas Cobradas */}
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="text-yellow-500 p-2.5 sm:p-3 bg-yellow-500/10 rounded-xl">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider m-0">Facturas Pagadas</p>
            <h3 className="text-xl sm:text-2xl font-black text-white m-0 mt-0.5">{totalInvoicesCount}</h3>
          </div>
        </div>
      </div>

      {/* Botón de Cierre de Caja */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">Cierre de Caja</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-0">Imprime el ticket de corte (Z) con desglose por categoría y auditoría de inventario.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={handlePrintZReceipt}
            disabled={totalInvoicesCount === 0}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm shrink-0"
          >
            <Printer className="w-4 h-4 text-yellow-400" />
            Imprimir Corte Z
          </button>

          <button
            onClick={handleCloseShift}
            disabled={activeTablesCount > 0}
            className={`flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-white transition-all shadow-sm text-xs sm:text-sm shrink-0 ${
              activeTablesCount > 0 
                ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/25 active:scale-95 cursor-pointer'
            }`}
          >
            {activeTablesCount > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Cerrar Caja
          </button>
        </div>
      </div>

      {activeTablesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 sm:p-4 rounded-xl flex items-center gap-3 text-amber-800 text-xs sm:text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="m-0">No puedes cerrar la caja porque hay {activeTablesCount} mesa(s) con clientes. Debes cobrar o cancelar todas las cuentas antes de cerrar el turno.</p>
        </div>
      )}

      {/* Historial de Facturas Emitidas Hoy en Turno */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
          Facturas Emitidas Recientemente en este Turno
        </h3>

        {paidInvoices.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center">
            <Receipt className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-600 m-0">No hay ventas en este turno.</p>
            <p className="text-xs text-slate-400 mt-1">Las facturas cobradas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                  <th className="p-2.5">N° Factura</th>
                  <th className="p-2.5">Mesa / Pagador</th>
                  <th className="p-2.5">Método</th>
                  <th className="p-2.5">Hora</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paidInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900">{inv.id}</td>
                    <td className="p-2.5">
                      <span className="font-semibold text-slate-800">{inv.tableName}</span>
                      <br />
                      <span className="text-slate-500 text-[11px]">{inv.customerName}</span>
                      <br />
                      <span className="text-amber-700 font-bold text-[10px]">🍹 Mesero: {inv.waiterName || 'Mesero'}</span>
                    </td>
                    <td className="p-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.paymentMethod === 'Efectivo' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500">{inv.date}</td>
                    <td className="p-2.5 text-right font-extrabold text-slate-800">
                      C${inv.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
