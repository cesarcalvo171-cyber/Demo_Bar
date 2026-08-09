import React, { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { CatalogManager } from './CatalogManager';
import { Inventory } from './Inventory';
import { AdminShiftHistory } from './AdminShiftHistory';
import { UserManager } from './UserManager';
import { ExpensesManager } from './ExpensesManager';
import { ProfitLossReport } from './ProfitLossReport';
import { GlobalAlerts } from './GlobalAlerts';
import { LayoutDashboard, ShoppingBag, Package, Users, ChevronLeft, ChevronRight, FileText, Wallet, LineChart } from 'lucide-react';

export const AdminView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Historial Cierres', icon: FileText },
    { id: 'expenses', label: 'Gastos y Pagos', icon: Wallet },
    { id: 'profitloss', label: 'Reportes Financieros', icon: LineChart },
    { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'users', label: 'Usuarios', icon: Users },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <GlobalAlerts />
      <AdminHeader />

      {/* Barra de Navegación Horizontal Exclusiva para Móviles (md:hidden) */}
      <div className="md:hidden bg-white border-b border-slate-200 px-2 py-2 flex items-center gap-1.5 overflow-x-auto shadow-xs sticky top-[57px] z-10 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar del Administrador para Desktop (hidden md:flex) */}
        <div
          className={`hidden md:flex relative shrink-0 flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
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
              {!isCollapsed && (
                <span className="bg-gradient-to-r from-yellow-900 bg-yellow-600 bg-clip-text text-transparent ml-1 font-black text-lg italic tracking-tight">
                  Zorix Pos
                </span>
              )}
            </div>

            {/* Menú de Navegación Desktop */}
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

        {/* Área de Contenido Principal Adaptada a Pantallas Móviles */}
        <div className="flex-1 w-full overflow-y-auto p-3 sm:p-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto pb-10">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'history' && <AdminShiftHistory />}
            {activeTab === 'expenses' && <ExpensesManager />}
            {activeTab === 'profitloss' && <ProfitLossReport />}
            {activeTab === 'catalog' && <CatalogManager />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'users' && <UserManager />}
          </div>
        </div>
      </div>
    </div>
  );
};
