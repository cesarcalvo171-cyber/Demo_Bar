import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BarProvider, useBar } from './context/BarContext';
import { TableGrid } from './components/waiter/TableGrid';
import { CashierView } from './components/cashier/CashierView';
import { AdminView } from './components/admin/AdminView';
import { Login } from './components/common/Login';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Footer } from './components/common/Footer';
const RootRedirect = () => {
  const { currentUser } = useBar();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
  if (currentUser.role === 'cajero') return <Navigate to="/cajero" replace />;
  return <Navigate to="/mesero" replace />;
};

const MainContent = () => {
  return (
    <Router>
      <main className="min-h-screen bg-slate-100">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/mesero"
            element={
              <ProtectedRoute allowedRoles={['mesero', 'admin']}>
                <TableGrid />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cajero"
            element={
              <ProtectedRoute allowedRoles={['cajero', 'admin']}>
                <CashierView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer/>
     
    </Router>
    
  );
};

export default function App() {
  return (
    <BarProvider>
      <MainContent />
    </BarProvider>
  );
}
