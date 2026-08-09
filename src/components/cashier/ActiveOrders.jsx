import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { OrderCard } from './OrderCard';
import { PaymentModal } from './PaymentModal';
import { Receipt, PlusCircle } from 'lucide-react';
import { OrderModal } from '../waiter/OrderModal';
import { Modal } from '../common/Modal';

export const ActiveOrders = () => {
  const { tables, addBarAccount ,addNewTable } = useBar();
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTableToEditId, setOrderTableToEditId] = useState(null);

  // Consideramos 'ocupada' o 'pendiente_pago' como activas
  const activeTables = tables.filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago');
  const orderTableToEdit = tables.find(t => String(t.id) === String(orderTableToEditId));

  const handleCreateBarAccount = async () => {
    const customerName = prompt("Ingresa el nombre del cliente para la cuenta en barra:");
    if (customerName) {
      const newId = await addBarAccount(customerName);
      if (newId) {
        setOrderTableToEditId(newId);
      }
    }
  };

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 m-0">Pedidos Activos en Vivo</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Supervisión, pedidos y cobro en tiempo real</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleCreateBarAccount}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 px-3.5 sm:px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all shrink-0 cursor-pointer text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Despachar Barra</span>
          </button>

          <button
            onClick={async () => { 
              // 1. Buscar la primera mesa base (Mesa 1 a 10) que esté libre
              const firstFreeBaseTable = tables.find(
                (t) => !t.isBar && parseInt(t.id, 10) <= 10 && t.status === "libre"
              );

              if (firstFreeBaseTable) {
                // Si la Mesa 1 (o 2, 3...) está libre, la abre directamente en Caja
                setOrderTableToEditId(firstFreeBaseTable.id);
              } else {
                // Si las 10 mesas fijas están todas ocupadas, crea la siguiente (Mesa 11, 12...)
                const newId = await addNewTable();
                if (newId) {
                  setOrderTableToEditId(newId);
                }
              }
            }}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2.5 px-3.5 sm:px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 text-xs sm:text-sm"
          >
            <span className="text-base sm:text-lg leading-none font-black">+</span>
            <span>Despachar Mesa</span>
          </button>
        </div>
      </div>

      {activeTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[40vh] p-6 text-center">
          <Receipt className="w-12 h-12 sm:w-16 sm:h-16 opacity-30 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-500 m-0">No hay pedidos activos</h3>
          <p className="text-xs sm:text-sm mt-1 max-w-sm">Las mesas que los meseros vayan abriendo aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6 items-start pb-10">
          {activeTables.map(table => (
            <OrderCard 
              key={table.id} 
              table={table} 
              onCheckout={setSelectedTable}
              onEdit={() => setOrderTableToEditId(table.id)}
            />
          ))}
        </div>
      )}

      {selectedTable && (
        <PaymentModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}

      {/* Modal para editar/crear pedido */}
      {orderTableToEdit && (
        <Modal
          isOpen={Boolean(orderTableToEdit)}
          onClose={() => setOrderTableToEditId(null)}
          title={`Gestión de ${orderTableToEdit.name}`}
          maxWidth="max-w-7xl"
        >
          <OrderModal
            table={orderTableToEdit}
            onClose={() => setOrderTableToEditId(null)}
          />
        </Modal>
      )}
    </div>
  );
};
