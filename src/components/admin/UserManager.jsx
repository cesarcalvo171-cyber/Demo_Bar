import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Users, UserPlus, Shield, UserCheck, Trash2, Edit2, Key, X } from 'lucide-react';

export const UserManager = () => {
  const { users, addUser, updateUser, deleteUser } = useBar();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'mesero'
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'mesero' });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, username: user.username, password: user.password || '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let finalData = { ...formData };
    if (finalData.role === 'mesero' || finalData.role === 'cajero') {
       if (!finalData.username.trim()) {
         finalData.username = `${finalData.role}_${Date.now().toString().slice(-4)}`;
       }
    } else {
       if (!finalData.username.trim()) return;
    }

    if (editingUser) {
      updateUser({ ...editingUser, ...finalData });
    } else {
      addUser(finalData);
    }
    setShowModal(false);
  };

  const handleDelete = (user) => {
    if (confirm(`¿Estás seguro de eliminar al usuario "${user.name}"?`)) {
      deleteUser(user.id);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800"><Shield className="w-3 h-3" /> Administrador</span>;
      case 'cajero':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800"><Key className="w-3 h-3" /> Cajero</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800"><UserCheck className="w-3 h-3" /> Mesero</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-800" />
            Gestión de Usuarios y Accesos
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Administra los roles y permisos del personal (Meseros, Cajeros y Administradores).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-yellow-500 font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-yellow-500" />
          Crear Nuevo Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                <th className="p-4">ID</th>
                <th className="p-4">Nombre Completo</th>
                <th className="p-4">Nombre de Usuario</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">#{user.id}</td>
                    <td className="p-4 font-bold text-slate-900">{user.name}</td>
                    <td className="p-4 font-mono text-slate-600">@{user.username}</td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar usuario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-base font-bold m-0 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-yellow-500" />
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Martínez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {formData.role === 'admin' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de Usuario (Login):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. admin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {formData.role === 'admin' ? 'Contraseña de Acceso:' : 'PIN de Acceso (6 dígitos):'}
                </label>
                <input
                  type={formData.role === 'admin' ? 'password' : 'text'}
                  required
                  placeholder={formData.role === 'admin' ? 'Contraseña de acceso' : 'Ej. 123456'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rol de Acceso:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                >
                  <option value="mesero">Mesero (Toma de Pedidos por Mesa)</option>
                  <option value="cajero">Cajero (Cobros y Corte de Caja)</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-yellow-500 font-bold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
