import React, { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { CatalogManager } from '../cashier/CatalogManager';
import { Inventory } from '../cashier/Inventory';
import { InvoiceHistory } from '../cashier/InvoiceHistory';
import { UserManager } from './UserManager';
import { LayoutDashboard, ShoppingBag, Package, Users, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { MdRestaurant } from "react-icons/md";

export const AdminView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Historial Cierres', icon: FileText },
    { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'users', label: 'Usuarios', icon: Users },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar del Administrador */}
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
            {/* Logo Admin */}
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
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all w-full text-left cursor-pointer group ${
                      isActive
                        ? 'bg-yellow-100 text-slate-900'
                        : 'bg-transparent text-slate-500 hover:bg-yellow-100 hover:text-slate-800'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Área de Contenido Principal */}
        <div className="flex-1 w-full overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'history' && <InvoiceHistory />}
            {activeTab === 'catalog' && <CatalogManager />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'users' && <UserManager />}
          </div>
        </div>
      </div>
    </div>
  );
};
