import React, { useEffect, useState } from 'react';
import { useBar } from '../../context/BarContext';
import { AlertTriangle, X } from 'lucide-react';

export const GlobalAlerts = () => {
  const { expenses } = useBar();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Buscar gastos no pagados con notificationDate dentro de los próximos 5 días
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExpenses = expenses.filter(e => {
      if (e.isPaid || !e.notificationDate) return false;
      const notificationDate = new Date(e.notificationDate);
      notificationDate.setHours(0, 0, 0, 0);

      // Diferencia en días
      const diffTime = notificationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 0 && diffDays <= 5;
    });

    setAlerts(upcomingExpenses);
  }, [expenses]);

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {alerts.map(alert => (
        <div key={alert.id} className="bg-white border-l-4 border-amber-500 rounded-lg shadow-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-right-8 duration-300">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-800 m-0">¡Alerta de Pago Próximo!</h4>
            <p className="text-xs text-slate-600 m-0 mt-1">
              El pago de <strong>{alert.description}</strong> está programado para el {new Date(alert.notificationDate).toLocaleDateString()}.
            </p>
          </div>
          <button 
            onClick={() => dismissAlert(alert.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
