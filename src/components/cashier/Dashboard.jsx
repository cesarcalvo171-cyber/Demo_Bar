import React, { useRef } from 'react';
import { useBar } from '../../context/BarContext';
import { DollarSign, Receipt, AlertTriangle, CheckCircle, Printer } from 'lucide-react';

export const Dashboard = () => {
  const { paidInvoices, shiftStartTime, tables, closeShift, currentUser } = useBar();
  const printRef = useRef(null);

  const totalInvoicesCount = paidInvoices.length;
  const totalCash = paidInvoices.filter(i => i.paymentMethod === 'Efectivo').reduce((sum, inv) => sum + inv.total, 0);
  const totalCard = paidInvoices.filter(i => i.paymentMethod !== 'Efectivo').reduce((sum, inv) => sum + inv.total, 0);
  const totalSales = totalCash + totalCard;

  const activeTablesCount = tables.filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago').length;

  const handleCloseShift = () => {
    if (activeTablesCount > 0) {
      alert(`No puedes cerrar caja. Hay ${activeTablesCount} mesa(s) abierta(s) o pendiente(s) de pago.`);
      return;
    }

    if (window.confirm('¿Estás seguro que deseas realizar el Cierre de Caja? Esto transferirá los datos al historial del Administrador y pondrá tu caja en C$0.00.')) {
      printZReceipt();
      closeShift();
      alert('Caja cerrada con éxito. ¡Buen turno!');
    }
  };

  const printZReceipt = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-NI", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const printContent = `
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 15px; font-weight: bold;">DEMO BAR</div>
        <div style="font-size: 10px; color: #666; margin-top: 2px;">Cierre de Caja (Corte Z)</div>
        <div style="border-top: 1px dashed #999; margin: 8px 0;"></div>
        <div style="font-size: 11px;">Fecha: ${dateStr}</div>
        <div style="font-size: 11px;">Hora: ${timeStr}</div>
        <div style="font-size: 11px;">Cajero: ${currentUser?.name || 'Cajero'}</div>
      </div>
      <div style="border-top: 1px dashed #999; margin: 8px 0;"></div>
      <div style="margin-bottom: 8px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Total Facturas:</span>
          <span>${totalInvoicesCount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Total Efectivo:</span>
          <span>C$${totalCash.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Total Tarjeta/Transf:</span>
          <span>C$${totalCard.toFixed(2)}</span>
        </div>
      </div>
      <div style="border-top: 1px dashed #999; margin: 8px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
        <span>TOTAL VENTAS:</span>
        <span>C$${totalSales.toFixed(2)}</span>
      </div>
      <div style="border-top: 1px dashed #999; margin: 8px 0;"></div>
      <div style="text-align: center; font-size: 11px; color: #777;">
        <div>Fin de Turno</div>
      </div>
    `;

    const printWindow = window.open("", "_blank", "width=420,height=600");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>Cierre de Caja</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Courier New,monospace;font-size:12px;color:#000;background:#fff;padding:16px;width:300px;}</style></head><body>" +
          printContent +
          "<script>window.onload=function(){window.print();window.close();}</script></body></html>"
      );
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas Principales (2 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Ventas del Día */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className=" text-yellow-500 p-3 ">
            <DollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-[18px] font-semibold font-serif text-yellow-500 uppercase tracking-wider m-0">Ventas del Turno</p>
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
      </div>

      {/* Botón de Cierre de Caja */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 m-0">Cierre de Caja</h3>
          <p className="text-sm text-slate-500 mt-1 mb-0">Imprime el ticket de corte (Z) y transfiere las ventas al historial del Administrador.</p>
        </div>
        <button
          onClick={handleCloseShift}
          disabled={activeTablesCount > 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
            activeTablesCount > 0 
              ? 'bg-slate-400 cursor-not-allowed opacity-70' 
              : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/25 cursor-pointer'
          }`}
        >
          {activeTablesCount > 0 ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          Cerrar Caja
        </button>
      </div>

      {activeTablesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 text-sm font-semibold">
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
