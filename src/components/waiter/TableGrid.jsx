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
  const { tables, addBarAccount } = useBar();
  const [selectedTableId, setSelectedTableId] = useState(null);
  const selectedTable = tables.find(t => t.id === selectedTableId);
   // Contadores rápidos para la barra de estado
  const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
  const pendingPaymentTables = tables.filter(t => t.status === 'pendiente_pago').length;


  return (
    <>
      <WaiterHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Encabezado e Instrucciones */}
      <div className="mb-6  p-4 rounded-xl   flex flex-col md:flex-row md:items-center justify-center gap-2">
  
  {/* <div className="flex items-center gap-2">
    <span className="text-slate-900">
      <LuLayoutPanelLeft className="w-14 h-14" />
    </span>

    <h2 className="text-[26px] font-serif font-semibold text-slate-900 m-0">
      Panel de Mesas
    </h2>
  </div> */}
  

  {/* Resumen del estado actual del local */}
  <div className="flex flex-col sm:flex-row items-center justify-between w-full md:flex-1 gap-4 bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 shadow-md">
    <div className="flex flex-wrap justify-center sm:justify-start gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-green-500">
           <TableIcon className="w-5 h-5 sm:w-6 sm:h-6 font-extrabold stroke-current stroke-[1px]" />
        </span>
        <span className="text-slate-300 font-serif text-sm sm:text-[16px]">
          Libres: <strong>{10 - occupiedTables - pendingPaymentTables > 0 ? 10 - occupiedTables - pendingPaymentTables : 0}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-red-500">
          <TableIcon className="w-5 h-5 sm:w-6 sm:h-6 font-extrabold stroke-current stroke-[1px]" />
        </span>
        <span className="text-slate-300 font-serif text-sm sm:text-[16px]">
          Ocupadas: <strong>{occupiedTables}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-yellow-500">
          <IoMdTime className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
        <span className="text-slate-300 font-serif text-sm sm:text-[16px]">
          Por Cobrar: <strong>{pendingPaymentTables}</strong>
        </span>
      </div>
    </div>
    
    <button
      onClick={async () => {
        const customerName = prompt("Ingresa el nombre del cliente en barra:");
        if (customerName) {
          const newId = await addBarAccount(customerName);
          setSelectedTableId(newId);
        }
      }}
      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center cursor-pointer"
    >
      <span className="text-xl leading-none mb-0.5">+</span>
      <span>Cuenta en Barra</span>
    </button>
  </div>

</div>

      {/* Grilla de 10 Mesas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
