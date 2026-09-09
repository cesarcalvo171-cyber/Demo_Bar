import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { OrderCard } from './OrderCard';
import { PaymentModal } from './PaymentModal';
import { Receipt, PlusCircle, Search, X } from 'lucide-react';
import { MdLocalBar, MdTableRestaurant } from "react-icons/md";
import { OrderModal } from '../waiter/OrderModal';
import { OpenTableModal } from '../common/OpenTableModal';
import { Modal } from '../common/Modal';

export const ActiveOrders = () => {
  const { tables, addBarAccount } = useBar();
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTableToEditId, setOrderTableToEditId] = useState(null);
  const [isOpenTableModalOpen, setIsOpenTableModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Consideramos 'ocupada' o 'pendiente_pago' como activas
  const activeTables = tables.filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago');
  const orderTableToEdit = tables.find(t => String(t.id) === String(orderTableToEditId));

  const normalize = (text = '') =>
    String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredTables = activeTables.filter(t => {
    if (!searchTerm.trim()) return true;
    const term = normalize(searchTerm);
    const matchName = normalize(t.name).includes(term);
    const matchCustomer = normalize(t.customerName).includes(term);
    const matchWaiter = normalize(t.assignedWaiterName).includes(term);
    const matchId = normalize(t.id).includes(term);
    return matchName || matchCustomer || matchWaiter || matchId;
  });

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
            <MdLocalBar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Despachar Barra</span>
          </button>

          <button
            onClick={() => setIsOpenTableModalOpen(true)}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2.5 px-3.5 sm:px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 text-xs sm:text-sm shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Despachar Mesa</span>
          </button>
        </div>
      </div>

      {/* Buscador de Mesas y Cuentas de Barra */}
      {activeTables.length > 0 && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por mesa, barra o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <span>Mostrando <strong>{filteredTables.length}</strong> de {activeTables.length} cuentas activas</span>
          </div>
        </div>
      )}

      {activeTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[40vh] p-6 text-center">
          <Receipt className="w-12 h-12 sm:w-16 sm:h-16 opacity-30 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-500 m-0">No hay pedidos activos</h3>
          <p className="text-xs sm:text-sm mt-1 max-w-sm">Las mesas que los meseros o cajeros vayan abriendo aparecerán aquí en tiempo real.</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[30vh] p-6 text-center bg-white rounded-2xl border border-slate-200">
          <Search className="w-10 h-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-600 m-0">No se encontraron coincidencias</h3>
          <p className="text-xs text-slate-400 mt-1">Ninguna mesa o cuenta coincide con "{searchTerm}".</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6 items-start pb-10">
          {filteredTables.map(table => (
            <OrderCard 
              key={table.id} 
              table={table} 
              onCheckout={setSelectedTable}
              onEdit={() => setOrderTableToEditId(table.id)}
            />
          ))}
        </div>
      )}

      {/* Modal para abrir nueva mesa */}
      <OpenTableModal
        isOpen={isOpenTableModalOpen}
        onClose={() => setIsOpenTableModalOpen(false)}
        onTableCreated={(newId) => setOrderTableToEditId(newId)}
      />

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
          height="h-[92vh]"
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

