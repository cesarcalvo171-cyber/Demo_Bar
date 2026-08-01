import React from 'react';
import { Navigate } from 'react-router-dom';
import { useBar } from '../../context/BarContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useBar();

  // Si no hay sesión iniciada en esta pestaña, redirige al Login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no tiene permisos para este módulo, redirige a su módulo por defecto
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    switch (currentUser.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'cajero':
        return <Navigate to="/cajero" replace />;
      default:
        return <Navigate to="/mesero" replace />;
    }
  }

  return children;
};
