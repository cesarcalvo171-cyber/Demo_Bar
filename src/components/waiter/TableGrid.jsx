import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { TableCard } from './TableCard';
import { OrderModal } from './OrderModal';
import { Modal } from '../common/Modal';
import { MdOutlineEventAvailable } from "react-icons/md";
import { MdEventBusy } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { LuLayoutPanelLeft } from "react-icons/lu";

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




import { WaiterHeader } from './WaiterHeader';

export const TableGrid = () => {
  const { tables, addBarAccount, addNewTable } = useBar();
  const [selectedTableId, setSelectedTableId] = useState(null);
  const selectedTable = tables.find(t => String(t.id) === String(selectedTableId));
  
  // Contadores rápidos para la barra de estado
  const occupiedTables = tables.filter(t => t.status === 'ocupada' && !t.isBar).length;
  const pendingPaymentTables = tables.filter(t => t.status === 'pendiente_pago' && !t.isBar).length;
  const barAccounts = tables.filter(t => t.isBar).length;
  const freeTables = tables.filter(t => t.status === 'libre' && !t.isBar).length;

  return (
    <>
      <WaiterHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Encabezado e Instrucciones */}
        <div className="mb-6 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-center gap-3">
          {/* Resumen del estado actual del local */}
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full md:w-auto md:flex-1 gap-4 bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 text-xs md:text-sm shadow-md">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-green-500">
                  <TableIcon className="w-6 h-6 font-extrabold stroke-current stroke-[1px]" />
                </span>
                <span className="text-slate-300 font-serif text-[16px]">
                  Libres: <strong>{freeTables}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-red-500">
                  <TableIcon className="w-6 h-6 font-extrabold stroke-current stroke-[1px]" />
                </span>
                <span className="text-slate-300 font-serif text-[16px]">
                  Ocupadas: <strong>{occupiedTables}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-yellow-500">
                  <IoMdTime className="w-5 h-5" />
                </span>
                <span className="text-slate-300 font-serif text-[16px]">
                  Por Cobrar: <strong>{pendingPaymentTables}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 md:ml-2 md:border-l border-slate-600 md:pl-4">
                <span className="text-blue-400">
                  <IoMdTime className="w-5 h-5" />
                </span>
                <span className="text-slate-300 font-serif text-[16px]">
                  Barra: <strong>{barAccounts}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const customerName = prompt("Ingresa el nombre del cliente en barra:");
                  if (customerName) {
                    const newId = await addBarAccount(customerName);
                    setSelectedTableId(newId);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs sm:text-sm"
              >
                <span className="text-base leading-none font-black">+</span>
                <span>Barra</span>
              </button>
              
              <button
                onClick={async () => { 
                  const newId = await addNewTable();
                  if (newId) {
                    setSelectedTableId(newId);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs sm:text-sm"
              >
                <span className="text-base leading-none font-black">+</span>
                <span>Mesa</span>
              </button>
            </div>
          </div>
        </div>

      {/* Grilla de 10 Mesas */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            onClick={() => setSelectedTableId(table.id)}
          />
        ))}
      </div>

      {/* Modal para tomar pedido */}
      {selectedTable && (
        <Modal
          isOpen={Boolean(selectedTable)}
          onClose={() => setSelectedTableId(null)}
          title={`Gestión de ${selectedTable.name}`}
          maxWidth="max-w-7xl"
          height="h-[92vh]"
        >
          <OrderModal
            table={selectedTable}
            onClose={() => setSelectedTableId(null)}
          />
        </Modal>
      )}
    </div>
    </>
  );
};
