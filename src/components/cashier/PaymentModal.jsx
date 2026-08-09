import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { X, DollarSign, CreditCard, Banknote, ArrowRight, Receipt } from 'lucide-react';
import { InvoicePreview } from '../waiter/InvoicePreview';

export const PaymentModal = ({ table, onClose }) => {
  const { payInvoice, exchangeRate } = useBar();
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [currency, setCurrency] = useState('NIO');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [snapshotData, setSnapshotData] = useState(null);

  const totalCordobas = table.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const totalDolares = totalCordobas / exchangeRate;

  // Calculadora
  const numericReceived = parseFloat(receivedAmount) || 0;
  let changeAmount = 0;
  let missingAmount = 0;

  if (currency === 'NIO') {
    changeAmount = numericReceived >= totalCordobas ? numericReceived - totalCordobas : 0;
    missingAmount = numericReceived < totalCordobas ? totalCordobas - numericReceived : 0;
  } else {
    changeAmount = numericReceived >= totalDolares ? numericReceived - totalDolares : 0;
    missingAmount = numericReceived < totalDolares ? totalDolares - numericReceived : 0;
  }

  const handleConfirm = () => {
    if (paymentMethod === 'Efectivo') {
      if (numericReceived <= 0) return alert('Debes ingresar el monto con el que está pagando el cliente.');
      if (missingAmount > 0) return alert(`El monto ingresado no cubre el total. Faltan ${currency === 'NIO' ? 'C$' : 'U$'}${missingAmount.toFixed(2)}`);
    } else {
      if (!referenceNumber.trim()) return alert('Debes ingresar el código de referencia o voucher.');
    }

    const paymentDetails = {
       method: paymentMethod,
       currency: currency,
       received: numericReceived,
       change: changeAmount,
       reference: referenceNumber
    };

    setSnapshotData({
      table: { ...table },
      items: [...table.items],
      customerName: table.customerName,
      paymentDetails
    });

    payInvoice(table.id, paymentMethod, referenceNumber);
  };

  if (snapshotData) {
    return (
      <InvoicePreview
        table={snapshotData.table}
        items={snapshotData.items}
        customerName={snapshotData.customerName}
        paymentDetails={snapshotData.paymentDetails}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="bg-slate-900 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white m-0">Cobrar {table.name}</h2>
            {table.customerName && <p className="text-xs sm:text-sm text-slate-300 font-semibold m-0">{table.customerName}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans">
          {/* Totales Grandes */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-center mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total a Pagar</p>
            <div className="flex flex-row items-center justify-center gap-3 sm:gap-6">
              <span className="text-2xl sm:text-4xl font-black text-slate-900">C${totalCordobas.toFixed(2)}</span>
              <span className="text-slate-300 text-xl sm:text-2xl font-light">|</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500">U${totalDolares.toFixed(2)}</span>
            </div>
          </div>

          {/* Selección de Método de Pago */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { id: 'Efectivo', icon: Banknote },
                { id: 'Tarjeta', icon: CreditCard },
                { id: 'Transferencia', icon: DollarSign }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    setReceivedAmount('');
                    setReferenceNumber('');
                  }}
                  className={`flex flex-col items-center justify-center py-3 sm:py-4 px-1.5 sm:px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === method.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <method.icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 ${paymentMethod === method.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] sm:text-xs font-bold">{method.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lógica Condicional del Método de Pago */}
          {paymentMethod === 'Efectivo' ? (
            <div className="space-y-4 sm:space-y-5 animate-in slide-in-from-bottom-2 duration-300">
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5 sm:mb-2">Moneda</label>
                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button 
                      onClick={() => setCurrency('NIO')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${currency === 'NIO' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      C$ (NIO)
                    </button>
                    <button 
                      onClick={() => setCurrency('USD')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${currency === 'USD' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      U$ (USD)
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5 sm:mb-2">¿Con cuánto paga el cliente?</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base sm:text-lg">
                      {currency === 'NIO' ? 'C$' : 'U$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="Ej. 1000"
                      className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-200 rounded-xl text-lg sm:text-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Resultado del Vuelto */}
              {receivedAmount !== '' && (
                <div className={`p-4 rounded-xl border-2 flex flex-col gap-2.5 ${
                  missingAmount > 0 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {missingAmount > 0 ? 'Falta por pagar:' : 'Vuelto / Cambio a entregar:'}
                    </span>
                    <span className="text-2xl font-black">
                      {currency === 'NIO' ? 'C$' : 'U$'}
                      {missingAmount > 0 ? missingAmount.toFixed(2) : changeAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Si el cliente paga en Dólares y hay vuelto, mostrar el vuelto en Córdobas abajo */}
                  {currency === 'USD' && missingAmount === 0 && changeAmount > 0 && (
                    <div className="flex items-center justify-between border-t border-emerald-200/80 pt-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Vuelto en Córdobas:
                      </span>
                      <span className="text-xl font-black text-emerald-800">
                        C${(changeAmount * (exchangeRate)).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {currency === 'NIO' && missingAmount === 0 && changeAmount > 0 && (
                    <div className="flex items-center justify-between border-t border-emerald-200/80 pt-2 text-emerald-900">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Equivalente en Dólares:
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        U${(changeAmount / (exchangeRate || 36.62)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                 Número de Referencia / Voucher
               </label>
               <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ingresa el N° de transacción o recibo..."
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            Confirmar y Cerrar Mesa
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
