import React from 'react';
import { Users, Clock, ShoppingBag } from 'lucide-react';
import { MdOutlineEventAvailable } from "react-icons/md";
import { MdEventBusy } from "react-icons/md";
import { MdTableRestaurant } from "react-icons/md";
import { IoMdTime } from "react-icons/io";

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
  const isOccupied = table.status === 'ocupada';
  const isPendingPayment = table.status === 'pendiente_pago';
  const isFree = table.status === 'libre';

  const totalItems = table.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = table.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Colores planos sólidos claros y entendibles
  let bgColor = 'bg-green-100 hover:bg-slate-100 border-green-400 text-white';
  let badgeicon = <TableIcon className="w-12 h-12 font-extrabold stroke-current stroke-[1px]" />;  // Icono para libre
  let badgeText = 'Disponible'; // Texto para libre
  
  if (isOccupied) {
    bgColor = 'bg-red-200 hover:bg-red-100/50 border-red-600 text-black';
     badgeicon = <TableIcon className="w-12 h-12 font-extrabold stroke-current stroke-[1px]" />; // Icono para ocupada
    badgeText='Ocupada'
    
  } else if (isPendingPayment) {
    bgColor = 'bg-amber-100 hover:bg-amber-600 border-amber-600 text-slate-900';
    badgeText = 'En Caja';
  
    badgeicon=<IoMdTime className="w-8 h-8"/>
  }

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-sm border-t-4 shadow-sm transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-80 ${bgColor}`}
    >
      <div className="flex flex-2 justify-center items-center gap-2">
        
        <span className="font-inter italic text-lg font-normal tracking-tight text-black">{table.name}</span>
      </div>

      <div className="mt-4 mb-4 flex flex-col gap-2">
         <span className={`text-[18px]  font-serif px-4 py-2 rounded-full uppercase tracking-wider mx-auto ${
          isFree ? 'bg-green-200 text-green-800' : isOccupied ? 'bg-red-700 text-white' : 'bg-amber-700 text-white '
        }`}>
          {badgeicon} 
         
        </span>
        <span className='font-serif italic text-[18px] mx-auto text-black'>
          {badgeText}
        </span>
        {isFree ? (
          
          <div className="text-center py-3 opacity-90">
            <hr  className=' text-green-400'/>
            <p className="text-[14px] opacity-75 mt-0.5 font-serif italic text-black">Haga clic para abrir pedido</p>
          </div>
        ) : (
          <div className="space-y-1 text-xs">
            {table.assignedWaiterName && (
              <div className="flex items-center gap-1 font-bold text-[11px] bg-slate-900 text-yellow-400 px-2 py-0.5 rounded w-fit">
                <span>👤 {table.assignedWaiterName}</span>
              </div>
            )}
            {table.customerName && (
              <div className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{table.customerName}</span>
              </div>
            )}
            <div className="flex items-center gap-1 opacity-90">
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>{totalItems} producto(s)</span>
            </div>
            <div className="flex items-center justify-between border-t border-black/10 pt-1.5 mt-1">
              <span className="font-semibold opacity-90">Total:</span>
              <span className="font-extrabold text-base">C${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
