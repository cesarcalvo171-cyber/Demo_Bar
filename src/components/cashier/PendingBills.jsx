import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { CreditCard, DollarSign, CheckCircle2, User, Clock, AlertTriangle } from 'lucide-react';

export const PendingBills = () => {
  const { tables, payInvoice } = useBar();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Efectivo');
  const [payingTableId, setPayingTableId] = useState(null);
  const [transactionId, setTransactionId] = useState('');

  // Filtrar mesas que están en estado "pendiente_pago" o con items listos para cobrar
  const pendingTables = tables.filter(t => t.status === 'pendiente_pago');

  const handleConfirmPay = (tableId) => {
    payInvoice(tableId, selectedPaymentMethod, transactionId);
    setPayingTableId(null);
    setTransactionId('');
  };

  const handleInitiatePay = (tableId) => {
    setPayingTableId(tableId);
    setSelectedPaymentMethod('Efectivo');
    setTransactionId('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Cobro de Cuentas / Facturación</h2>
          <p className="text-xs text-slate-500 m-0">
            Cuentas enviadas por los meseros listas para emitir factura y cancelar pago.
          </p>
        </div>
        <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300">
          {pendingTables.length} Pendientes de Cobro
        </span>
      </div>

      {pendingTables.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 m-0">No hay cuentas pendientes por cobrar</h3>
          <p className="text-xs mt-1 text-slate-500">
            Cuando un mesero presione "Enviar Pedido a Caja", la factura aparecerá en esta sección para ser cancelada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingTables.map(table => {
            const total = table.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

            return (
              <div key={table.id} className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
                {/* Header de la tarjeta */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-base m-0">{table.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-300 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{table.customerName}</span>
                    </div>
                  </div>
                  <span className="bg-amber-500 text-slate-900 text-xs font-extrabold px-2.5 py-1 rounded">
                    Por Pagar
                  </span>
                </div>

                {/* Desglose de ítems */}
                <div className="p-4 space-y-2 flex-1 max-h-48 overflow-y-auto">
                  {table.items.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                      <span className="text-slate-800 font-medium">{item.quantity}x {item.product.name}</span>
                      <span className="font-semibold text-slate-900">C${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer de Cobro */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-600">TOTAL FACTURA:</span>
                    <span className="text-xl font-extrabold text-slate-900">C${total.toFixed(2)}</span>
                  </div>

                  {payingTableId === table.id ? (
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700">Seleccionar Método de Pago:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('Efectivo')}
                          className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            selectedPaymentMethod === 'Efectivo'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Efectivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('Tarjeta')}
                          className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            selectedPaymentMethod === 'Tarjeta'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Tarjeta
                        </button>
                      </div>

                      {selectedPaymentMethod === 'Tarjeta' && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                            Nro. Autorización / Voucher (Opcional)
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ej. 123456" 
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setPayingTableId(null)}
                          className="flex-1 bg-slate-200 text-slate-700 font-semibold py-1.5 rounded text-xs hover:bg-slate-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleConfirmPay(table.id)}
                          className="flex-1 bg-emerald-600 text-white font-bold py-1.5 rounded text-xs hover:bg-emerald-700 cursor-pointer shadow-xs"
                        >
                          Confirmar Cobro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInitiatePay(table.id)}
                      className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-4 h-4" /> Cancelar Factura
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
