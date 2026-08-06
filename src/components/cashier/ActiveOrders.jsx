import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { OrderCard } from './OrderCard';
import { PaymentModal } from './PaymentModal';
import { Receipt, PlusCircle } from 'lucide-react';
import { OrderModal } from '../waiter/OrderModal';
import { Modal } from '../common/Modal';

export const ActiveOrders = () => {
  const { tables, addBarAccount } = useBar();
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTableToEditId, setOrderTableToEditId] = useState(null);

  // Consideramos 'ocupada' o 'pendiente_pago' como activas
  const activeTables = tables.filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago');
  const orderTableToEdit = tables.find(t => t.id === orderTableToEditId);

  const handleCreateBarAccount = () => {
    const customerName = prompt("Ingresa el nombre del cliente para la cuenta en barra:");
    if (customerName) {
      const newId = addBarAccount(customerName);
      setOrderTableToEditId(newId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 m-0">Pedidos Activos en Vivo</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Supervisión y cobro de mesas en tiempo real</p>
        </div>
        <button
          onClick={handleCreateBarAccount}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-xl shadow-md flex items-center gap-2 transition-colors shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Despachar en Barra
        </button>
      </div>

      {activeTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-[60vh]">
          <Receipt className="w-16 h-16 opacity-30 mb-4" />
          <h3 className="text-lg font-bold text-slate-500 m-0">No hay pedidos activos</h3>
          <p className="text-sm">Las mesas que los meseros vayan abriendo aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start pb-10">
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
