import React, { useRef, useState } from "react";
import { Printer, CheckCircle, X } from "lucide-react";
import { useBar } from "../../context/BarContext";
import logo_f from "../../assets/Imagenes/logofactura.png";


export const InvoicePreview = ({ table, items, customerName, paymentDetails, onClose }) => {
  const { currentUser, exchangeRate } = useBar();
  const printRef = useRef();
  const [hasPrinted, setHasPrinted] = useState(false);

  const baseTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const isCard = paymentDetails?.method === 'Tarjeta';
  const cardFee = isCard ? baseTotal * 0.10 : 0;
  const total = baseTotal + cardFee;
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const isFinal = !!paymentDetails;
  const invoiceNum = (isFinal ? "FAC-" : "PREV-") + Date.now().toString().slice(-6);

  const handlePrint = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const printContent = printRef.current ? printRef.current.innerHTML : "";
    const printWindow = window.open("", "_blank", "width=420,height=680");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>" + (isFinal ? "Factura" : "Pre-Recibo") + "</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Courier New,monospace;font-size:12px;color:#000;background:#fff;padding:16px;width:300px;}</style></head><body>" +
          printContent +
          "<script>window.onload=function(){window.print();window.close();}</script></body></html>",
      );
      printWindow.document.close();
    }
    setHasPrinted(true);
  };

  const handleCloseBtn = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onClose === "function") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-bold text-sm">
              {isFinal ? "Factura del Cliente" : "Pre-Recibo del Cliente"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isFinal && (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Enviado a Caja
              </span>
            )}
            <button
              type="button"
              onClick={handleCloseBtn}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 bg-[#fffef7] border-b border-slate-200 max-h-[60vh] overflow-y-auto">
          <div
            ref={printRef}
            style={{
              fontFamily: "Courier New, monospace",
              fontSize: "12px",
              color: "#111",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold" }}>
             MONCHOS BAR
              </div>
       
              
              <div
                style={{ fontSize: "16px", color: "#000000", marginTop: "2px" }}
              >
                Sistema de Gestión de Bar
              </div>
              <div
                style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}
              ></div>
              <div style={{ fontSize: "16px" }}>Fecha: {dateStr}</div>
              <div style={{ fontSize: "16px" }}>Hora: {timeStr}</div>
            </div>
            <div
              style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}
            ></div>
            <div style={{ marginBottom: "8px", fontSize: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>Mesa:</span>
                <span>{table.name}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>Cliente:</span>
                <span>{customerName || "Cliente General"}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>Mesero:</span>
                <span>{currentUser?.name || table.assignedWaiterName || "Mesero"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold" }}>{isFinal ? "Factura N°:" : "Ref.:"}</span>
                <span style={{ fontSize: "16px" }}>{invoiceNum}</span>
              </div>
            </div>
            <div
              style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}
            ></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                color: "#000000",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              <span style={{ flex: 1 }}>DESCRIPCION</span>
              <span style={{ width: "28px", textAlign: "center" }}>CANT</span>
              <span style={{ width: "75px", textAlign: "right" }}>TOTAL</span>
            </div>
            <div
              style={{ borderTop: "1px dashed #ccc", margin: "3px 0 6px" }}
            ></div>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                  alignItems: "flex-start",
                  fontSize: "16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div>{item.product.name}</div>
                  <div style={{ fontSize: "16px", color: "#000000" }}>
                    C${item.product.price.toFixed(2)} c/u
                  </div>
                </div>
                <span style={{ width: "28px", textAlign: "center" }}>
                  {item.quantity}
                </span>
                <span
                  style={{
                    width: "85px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  C${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div
              style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}
            ></div>
            {isCard && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "3px",
                  }}
                >
                  <span>Subtotal:</span>
                  <span>C${baseTotal.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  <span>Recargo 10% Tarjeta:</span>
                  <span>+C${cardFee.toFixed(2)}</span>
                </div>
              </>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "16px",
                marginBottom: "10px",
              }}
            >
              <span>TOTAL A PAGAR:</span>
              <span>C${total.toFixed(2)}</span>
            </div>
            {/*  Equivalente en Dólares */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "16px",
                marginBottom: "10px",
                color: "#000000",
              }}
            >
              <span>Total USD (Tasa {exchangeRate}):</span>
              <span>US${(total / exchangeRate).toFixed(2)}</span>
            </div>
            
            {isFinal && paymentDetails && (
              <>
                <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "3px" }}>
                  <span style={{ fontWeight: "bold" }}>Método Pago:</span>
                  <span>{paymentDetails.method}</span>
                </div>
                {paymentDetails.method === 'Efectivo' ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "3px" }}>
                      <span style={{ fontWeight: "bold" }}>Recibido ({paymentDetails.currency}):</span>
                      <span>{paymentDetails.currency === 'NIO' ? 'C$' : 'US$'}{paymentDetails.received.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "3px" }}>
                      <span style={{ fontWeight: "bold" }}>Vuelto ({paymentDetails.currency}):</span>
                      <span>{paymentDetails.currency === 'NIO' ? 'C$' : 'US$'}{paymentDetails.change.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: "bold" }}>Ref/Voucher:</span>
                    <span>{paymentDetails.reference}</span>
                  </div>
                )}
              </>
            )}

            <div
              style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}
            ></div>
            <div
              style={{ textAlign: "center", fontSize: "12px", color: "#777" }}
            >
              <div>¡Gracias por su {isFinal ? "compra" : "visita"}!</div>
              <div style={{ marginTop: "3px" }}>
                Este documento es {isFinal ? "una factura." : "un pre-recibo."}
              </div>
              {!isFinal && <div>No tiene validez fiscal.</div>}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 flex flex-col gap-2.5">
          {!hasPrinted ? (
            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir Pre-Recibo
            </button>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold">
                <CheckCircle className="w-4 h-4" /> Pre-recibo enviado a
                imprimir
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Listo, Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
