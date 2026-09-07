import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { TableCard } from './TableCard';
import { OrderModal } from './OrderModal';
import { OpenTableModal } from '../common/OpenTableModal';
import { Modal } from '../common/Modal';
import { IoMdTime } from "react-icons/io";
import { PlusCircle, UtensilsCrossed } from "lucide-react";
import { MdLocalBar, MdTableRestaurant } from "react-icons/md";
import { WaiterHeader } from './WaiterHeader';

export const TableGrid = () => {
  const { tables, addBarAccount } = useBar();
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isOpenTableModalOpen, setIsOpenTableModalOpen] = useState(false);
  const selectedTable = tables.find(t => String(t.id) === String(selectedTableId));
  
  // Contadores rápidos para la barra de estado
  const occupiedTables = tables.filter(t => t.status === 'ocupada' && !t.isBar).length;
  const pendingPaymentTables = tables.filter(t => t.status === 'pendiente_pago' && !t.isBar).length;
  const barAccounts = tables.filter(t => t.isBar).length;

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
                <span className="text-emerald-400">
                  <MdTableRestaurant className="w-5 h-5" />
                </span>
                <span className="text-slate-300 font-medium text-sm">
                  Mesas Activas: <strong className="text-white">{occupiedTables}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">
                  <IoMdTime className="w-5 h-5" />
                </span>
                <span className="text-slate-300 font-medium text-sm">
                  Por Cobrar: <strong className="text-white">{pendingPaymentTables}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 md:ml-2 md:border-l border-slate-600 md:pl-4">
                <span className="text-blue-400">
                  <MdLocalBar className="w-5 h-5" />
                </span>
                <span className="text-slate-300 font-medium text-sm">
                  Barra: <strong className="text-white">{barAccounts}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const customerName = prompt("Ingresa el nombre del cliente en barra:");
                  if (customerName) {
                    const newId = await addBarAccount(customerName);
                    if (newId) {
                      setSelectedTableId(newId);
                    }
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs sm:text-sm"
              >
                <span className="text-base leading-none font-black">+</span>
                <span>Barra</span>
              </button>
              
              <button
                onClick={() => setIsOpenTableModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs sm:text-sm shadow-emerald-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Abrir Mesa</span>
              </button>
            </div>
          </div>
        </div>

      {/* Grilla de Mesas Activas o Estado Vacío */}
      {tables.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-4 bg-slate-800/80 rounded-2xl text-emerald-400 mb-4 border border-slate-700">
            <MdTableRestaurant className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No hay mesas ni cuentas activas</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Abre una nueva mesa asignando el número de mesa y el cliente para comenzar a tomar pedidos.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpenTableModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 text-sm shadow-emerald-600/20"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Abrir Nueva Mesa</span>
            </button>
            <button
              onClick={async () => {
                const customerName = prompt("Ingresa el nombre del cliente en barra:");
                if (customerName) {
                  const newId = await addBarAccount(customerName);
                  if (newId) {
                    setSelectedTableId(newId);
                  }
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 text-sm"
            >
              <MdLocalBar className="w-5 h-5" />
              <span>Cuenta en Barra</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => setSelectedTableId(table.id)}
            />
          ))}
        </div>
      )}

      {/* Modal para abrir nueva mesa */}
      <OpenTableModal
        isOpen={isOpenTableModalOpen}
        onClose={() => setIsOpenTableModalOpen(false)}
        onTableCreated={(newId) => setSelectedTableId(newId)}
      />

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

