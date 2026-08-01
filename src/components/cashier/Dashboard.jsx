import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { DollarSign, Receipt, ShoppingCart, TrendingUp, Archive, AlertTriangle } from 'lucide-react';

export const Dashboard = () => {
  const { paidInvoices, closeCashRegister, shiftStartTime, users } = useBar();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [cashierNameInput, setCashierNameInput] = useState('');

  const totalInvoicesCount = paidInvoices.length;
  const totalCash = paidInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, inv) => sum + inv.total, 0);
  const totalCard = paidInvoices.filter(i => i.paymentMethod === 'Tarjeta').reduce((sum, inv) => sum + inv.total, 0);
  const totalSales = totalCash + totalCard;
  const averageTicket = totalInvoicesCount > 0 ? totalSales / totalInvoicesCount : 0;

  const handleConfirmClose = () => {
    closeCashRegister(cashierNameInput || 'Cajero Principal');
    setShowCloseModal(false);
    setCashierNameInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado con Botón de Cierre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Estado de Caja (Turno Actual)</h2>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Abierta desde: {new Date(shiftStartTime).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setShowCloseModal(true)}
          disabled={paidInvoices.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all ${
            paidInvoices.length === 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
          }`}
        >
          <Archive className="w-4 h-4" />
          Realizar Corte de Caja (Z)
        </button>
      </div>

      {/* Tarjetas de Métricas Principales (3 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ventas del Día */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className=" text-yellow-500 p-3 ">
            <DollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-[18px] font-semibold font-serif text-yellow-500 uppercase tracking-wider m-0">Ventas del Día</p>
            <h3 className="text-2xl font-extrabold text-white  font-serif m-0">C${totalSales.toFixed(2)}</h3>
          </div>
        </div>

        {/* Facturas Cobradas */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className=" text-yellow-500 p-3 ">
            <Receipt className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-[18px] font-semibold font-serif text-yellow-500 uppercase tracking-wider m-0">Facturas Pagadas</p>
            <h3 className="text-2xl font-extrabold text-white font-serif m-0">{totalInvoicesCount}</h3>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className=" text-yellow-500 p-3 ">
            <TrendingUp className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-[18px] font-semibold font-serif text-yellow-500 uppercase tracking-wider m-0">Ticket Promedio</p>
            <h3 className="text-2xl font-extrabold text-white font-serif m-0">C${averageTicket.toFixed(2)}</h3>
          </div>
        </div>
      </div>

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

      {/* Modal de Cierre de Caja */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-center relative">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white m-0">Confirmar Cierre de Caja</h3>
              <p className="text-xs text-slate-400 mt-1">Se generará el corte y el turno actual quedará en C$0.00.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cajero Responsable del Corte:
                  </label>
                  <select
                    value={cashierNameInput}
                    onChange={(e) => setCashierNameInput(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    <option value="">-- Seleccionar Cajero --</option>
                    {users.filter(u => u.role === 'cajero').map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-semibold">Total Efectivo en Cajón:</span>
                  <span className="text-emerald-600 font-extrabold text-base">C${totalCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-semibold">Total Vouchers Tarjeta:</span>
                  <span className="text-blue-600 font-extrabold text-base">C${totalCard.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-800 font-bold uppercase text-xs">Total Facturado:</span>
                  <span className="text-slate-900 font-extrabold text-xl">C${totalSales.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Confirmar Cierre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
