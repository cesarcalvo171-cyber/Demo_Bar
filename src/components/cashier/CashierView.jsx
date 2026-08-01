import React, { useState } from 'react';
import { Dashboard } from './Dashboard';
import { PendingBills } from './PendingBills';
import { InvoiceHistory } from './InvoiceHistory';
import { LayoutDashboard, Receipt, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { CashierHeader } from './CashierHeader';
import { MdRestaurant } from "react-icons/md";
import { useBar } from '../../context/BarContext';

export const CashierView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { tables } = useBar();

  // Calcular cuentas pendientes
  const pendingCount = tables.filter(t => t.status === 'pendiente_pago').length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pending', label: 'Cobros', icon: Receipt, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'history', label: 'Historial', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <CashierHeader />
      <div className="flex flex-1 overflow-hidden">
        
       
        <div 
          className={`relative shrink-0 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-[76px]' : 'w-64'
          }`}
        >
         
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer z-10"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          <div className="p-4 flex flex-col h-full">
            {/* Logo Simulado */}
            <div className={`flex items-center mb-8 mt-2 ${isCollapsed ? 'justify-center' : 'justify-start px-2'}`}>
              <div className="w-10 h-10 bg-slate-800 rounded-[12px] flex items-center justify-center shrink-0">
                <MdRestaurant className="w-5 h-5 text-yellow-500" />
              </div>
            </div>

            {/* Menú de Navegación */}
            <div className="flex flex-col gap-2 flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={isCollapsed ? tab.label : ''}
                    className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all w-full text-left cursor-pointer group ${
                      isActive
                        ? 'bg-yellow-100 text-slate-900'
                        : 'bg-transparent text-slate-500 hover:bg-yellow-100 hover:text-slate-800'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {/* Alerta tipo Badge */}
                      {tab.badge && isCollapsed && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex flex-1 items-center justify-between truncate">
                        <span className="truncate">{tab.label}</span>
                        {tab.badge && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-extrabold text-white">
                            {tab.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Área de Contenido Principal */}
        <div className="flex-1 w-full overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'pending' && <PendingBills />}
            {activeTab === 'history' && <InvoiceHistory />}
          </div>
        </div>
        
      </div>
    </div>
  );
};
