import React from 'react';
import { DollarSign, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { MdLocalBar } from "react-icons/md";
import { useBar } from '../../context/BarContext';

export const OrderCard = ({ table, onCheckout, onEdit }) => {
  const { deleteTable } = useBar();
  const total = table.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const isPending = table.status === 'pendiente_pago';
  const isBar = table.isBar;
  const isEmpty = table.items.length === 0 && total === 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-200 transition-all ${
      isPending ? 'border-red-500 ring-2 ring-red-500/50' : isBar ? 'border-blue-400' : 'border-slate-200'
    }`}>
      {/* Encabezado */}
      <div className={`${isPending ? 'bg-red-600' : isBar ? 'bg-blue-600' : 'bg-slate-900'} p-4 text-white flex justify-between items-start relative`}>
        {isPending && (
          <div className="absolute top-0 left-0 right-0 bg-red-700 text-center py-0.5 text-[10px] font-black tracking-widest uppercase animate-pulse">
            CUENTA SOLICITADA
          </div>
        )}
        <div className={isPending ? 'mt-3' : ''}>
          <h3 className="font-black text-lg m-0 leading-none truncate max-w-[150px] flex items-center gap-1.5">
            {isBar && <MdLocalBar className="text-yellow-300 w-5 h-5" />}
            {table.name}
          </h3>
          {table.customerName && (
            <p className="text-xs text-slate-300 font-semibold mt-1 truncate max-w-[150px]">
              {table.customerName}
            </p>
          )}
        </div>
        <div className={`flex flex-col items-end ${isPending ? 'mt-3' : ''}`}>
          <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
            {table.items.length} {table.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className="text-[10px] text-slate-300 mt-1 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {table.createdAt ? new Date(table.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>

      {/* Lista de Productos (Resumen Completo) */}
      <div className="flex-1 p-0 overflow-y-auto max-h-[250px] bg-slate-50/50">
        <ul className="divide-y divide-slate-100 m-0 p-0 list-none">
          {table.items.map((item, idx) => (
            <li key={idx} className="p-3 hover:bg-white transition-colors flex justify-between items-start gap-2">
              <div className="flex gap-2">
                <span className="font-bold text-slate-400 text-sm">{item.quantity}x</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 m-0 leading-tight">{item.product.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium m-0">C${item.product.price.toFixed(2)} c/u</p>
                </div>
              </div>
              <span className="font-bold text-slate-700 text-sm">
                C${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer / Total y Botón */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-2xl font-black text-slate-900 leading-none">C${total.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit()}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm shadow-blue-600/20"
              title="Editar Pedido"
            >
              <Edit className="w-5 h-5" />
              Editar
            </button>
          )}
          {isEmpty ? (
            <button
              onClick={() => deleteTable(table.id)}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
              title="Eliminar Cuenta Vacía"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar
            </button>
          ) : (
            <button
              onClick={() => onCheckout(table)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <DollarSign className="w-5 h-5" />
              Cobrar Mesa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
