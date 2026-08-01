import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Search, Calendar, FileText, CreditCard, DollarSign, ChevronDown, ChevronUp, Archive } from 'lucide-react';

export const InvoiceHistory = () => {
  const { cashRegisterHistory } = useBar();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClosureId, setExpandedClosureId] = useState(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  const filteredHistory = cashRegisterHistory.filter(closure => 
    closure.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    closure.invoices.some(inv => 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.transactionId && inv.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-600" />
            Historial de Cierres de Caja
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Registro histórico agrupado por turnos y cortes Z.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Buscar cierre, factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            No se encontraron cierres de caja en el historial.
          </div>
        ) : (
          filteredHistory.map((closure) => {
            const isExpanded = expandedClosureId === closure.id;
            const openDate = new Date(closure.openTime).toLocaleString();
            const closeDate = new Date(closure.closeTime).toLocaleString();

            return (
              <div key={closure.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                {/* Cabecera del Cierre */}
                <div 
                  className="p-5 cursor-pointer hover:bg-slate-50 flex flex-col md:flex-row justify-between md:items-center gap-4"
                  onClick={() => setExpandedClosureId(isExpanded ? null : closure.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                      <Archive className="w-5 h-5 text-slate-600" />
                    </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 m-0">{closure.id}</h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                            👤 {closure.cashierName || 'Cajero Principal'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {openDate} - {closeDate}
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <DollarSign className="w-3.5 h-3.5" /> C${closure.totalCash.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <CreditCard className="w-3.5 h-3.5" /> C${closure.totalCard.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Total Turno</span>
                      <span className="font-extrabold text-slate-900 text-lg">C${closure.totalSales.toFixed(2)}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Detalle de Facturas (Acordeón) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Desglose de Facturas ({closure.invoices.length})
                    </h4>
                    {closure.invoices.length === 0 ? (
                        <p className="text-xs text-slate-400">No se emitieron facturas en este turno.</p>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                              <th className="p-3">N° Factura</th>
                              <th className="p-3">Hora</th>
                              <th className="p-3">Mesa / Cliente</th>
                              <th className="p-3">Pago</th>
                              <th className="p-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {closure.invoices.map((inv) => (
                              <React.Fragment key={inv.id}>
                                <tr 
                                  className="hover:bg-slate-50 cursor-pointer"
                                  onClick={() => setExpandedInvoiceId(expandedInvoiceId === inv.id ? null : inv.id)}
                                >
                                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                    {expandedInvoiceId === inv.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    {inv.id}
                                  </td>
                                  <td className="p-3 text-slate-500">{inv.date}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-800">{inv.tableName}</div>
                                    <div className="text-slate-500 text-[10px]">Cliente: {inv.customerName}</div>
                                    <div className="text-amber-700 font-bold text-[10px] flex items-center gap-1 mt-0.5">
                                      🍹 Atendido por: {inv.waiterName || 'Mesero'}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[10px] w-fit ${
                                        inv.paymentMethod === 'Efectivo' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {inv.paymentMethod}
                                      </span>
                                      {inv.paymentMethod === 'Tarjeta' && inv.transactionId && (
                                        <span className="text-[9px] font-mono text-slate-400">
                                          Ref: {inv.transactionId}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-extrabold text-slate-800">
                                    C${inv.total.toFixed(2)}
                                  </td>
                                </tr>
                                {expandedInvoiceId === inv.id && (
                                  <tr className="bg-slate-100/60">
                                    <td colSpan="5" className="px-8 py-4 border-t border-slate-200">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
                                        <span>Detalle del Consumo</span>
                                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 font-extrabold">
                                          🍹 Mesero: {inv.waiterName || 'Mesero'}
                                        </span>
                                      </div>
                                      <div className="space-y-2 border-l-2 border-slate-300 pl-4 ml-1">
                                        {inv.items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-xs max-w-md">
                                            <span className="text-slate-600 font-medium">
                                              <span className="text-slate-900 font-extrabold mr-2">{item.quantity}x</span> 
                                              {item.name}
                                            </span>
                                            <span className="font-bold text-slate-900">C${(item.price * item.quantity).toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
