import React from 'react';
import { Users, Clock, ShoppingBag, Trash2 } from 'lucide-react';
import { MdTableRestaurant, MdLocalBar } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { useBar } from '../../context/BarContext';

const TableIcon = (props) => (
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55.2 55.2" {...props}>
    <g>
      <rect x="11.1" y="22" style={{ fill: "currentColor" }} width="32.9" height="2.1"/>
      <rect x="14.6" y="25" style={{ fill: "currentColor" }} width="1.7" height="11.6"/>
      <rect x="38.9" y="25" style={{ fill: "currentColor" }} width="1.7" height="11.6"/>
      <path style={{ fill: "currentColor" }} d="M3.6,26.2c0.1-2.1,0.2-4.1-2.1-7.6l-1.5,1c2,3,1.9,4.1,1.8,6c-0.1,1.2-0.1,3.1,0.3,5v6h1.8v-5.2H10v5.2h1.6v-6.9H3.8C3.5,28.3,3.5,27.2,3.6,26.2z"/>
      <path style={{ fill: "currentColor" }} d="M53.4,25.6c-0.1-2-0.2-3,1.8-6l-1.5-1c-2.3,3.5-2.2,5.5-2.1,7.6c0,1,0.1,2.1-0.2,3.5h-7.8v6.9h1.7v-5.2h6.1v5.2h1.8v-6C53.6,28.7,53.5,26.8,53.4,25.6z"/>
    </g>
  </svg>
);

export const TableCard = ({ table, onClick }) => {
  const { deleteTable } = useBar();
  const isOccupied = table.status === 'ocupada';
  const isPendingPayment = table.status === 'pendiente_pago';
  const isBar = table.isBar;

  const totalItems = table.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = table.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let bgColor = 'bg-white hover:bg-slate-50 border-slate-700 text-slate-900';
  let badgeicon = isBar ? <MdLocalBar className="w-10 h-10" /> : <TableIcon className="w-10 h-10 font-extrabold stroke-current stroke-[1px]" />;
  let badgeText = isBar ? 'Barra' : 'Ocupada';
  
  if (isOccupied) {
    bgColor = isBar ? 'bg-blue-950/40 hover:bg-blue-900/40 border-blue-600/80 text-white' : 'bg-red-950/40 hover:bg-red-900/40 border-red-600/80 text-white';
    badgeicon = isBar ? <MdLocalBar className="w-10 h-10 text-blue-400" /> : <TableIcon className="w-10 h-10 text-red-400 font-extrabold stroke-current stroke-[1px]" />;
    badgeText = isBar ? 'Barra' : 'Ocupada';
  } else if (isPendingPayment) {
    bgColor = isBar ? 'bg-indigo-950/40 hover:bg-indigo-900/40 border-indigo-500 text-white' : 'bg-amber-950/40 hover:bg-amber-900/40 border-amber-500 text-white';
    badgeText = 'En Caja';
    badgeicon = <IoMdTime className="w-8 h-8 text-amber-400"/>;
  }

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border-2 shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[300px] relative backdrop-blur-sm ${bgColor}`}
    >
      <div className="flex justify-between items-center w-full relative">
        <div className="flex items-center gap-2 flex-1">
          {isBar ? (
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <MdLocalBar className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <MdTableRestaurant className="w-5 h-5" />
            </div>
          )}
          <span className="font-sans text-lg font-black tracking-tight text-white">{table.name}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`¿Deseas cerrar o eliminar la ${table.name}?`)) {
              deleteTable(table.id);
            }
          }}
          title="Eliminar o cancelar mesa"
          className="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer active:scale-90"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="my-3 flex flex-col items-center gap-1.5">
        <div className="p-3 rounded-full bg-slate-900/70 border border-slate-700/60 shadow-inner flex items-center justify-center">
          {badgeicon}
        </div>
        <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
          {badgeText}
        </span>
      </div>

      <div className="space-y-2 text-xs bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        {table.assignedWaiterName && (
          <div className="flex items-center gap-1 font-bold text-[11px] text-amber-300">
            <span>👤 {table.assignedWaiterName}</span>
          </div>
        )}
        {table.customerName ? (
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{table.customerName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 italic text-[11px]">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Sin nombre asignado</span>
          </div>
        )}
        <div className="flex items-center justify-between opacity-90 text-slate-300">
          <span className="flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{totalItems} producto(s)</span>
          </span>
          <span className="font-extrabold text-base text-emerald-400">
            C${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

