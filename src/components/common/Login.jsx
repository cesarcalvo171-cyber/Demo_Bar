import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBar } from '../../context/BarContext';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { MdRestaurant } from "react-icons/md";

export const Login = () => {
  const { login, loginMesero } = useBar();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('mesero');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    let res;
    if (loginType === 'mesero') {
      if (!pin.trim()) {
        setErrorMsg('Debes ingresar tu PIN');
        return;
      }
      res = loginMesero(pin);
    } else {
      res = login(username, password);
    }

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    // Redirigir al panel correspondiente según el rol
    if (res.user.role === 'admin') navigate('/admin');
    else if (res.user.role === 'cajero') navigate('/cajero');
    else navigate('/mesero');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header Branding */}
        <div className="p-8 pb-6 text-center border-b border-slate-800 bg-slate-900">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MdRestaurant className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-extrabold font-serif text-white tracking-tight m-0">DEMO BAR</h1>
          <p className="text-xs text-yellow-500 font-bold mt-1 uppercase tracking-widest">Sistema de Gestión v1.0</p>
        </div>

        {/* Tabs de Login */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => { setLoginType('mesero'); setErrorMsg(''); }}
            className={`flex-1 py-4 text-sm font-extrabold transition-colors cursor-pointer ${
              loginType === 'mesero' ? 'bg-slate-800 text-yellow-500' : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            🍽️ Acceso Meseros
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('admin'); setErrorMsg(''); }}
            className={`flex-1 py-4 text-sm font-extrabold transition-colors cursor-pointer ${
              loginType === 'admin' ? 'bg-slate-800 text-yellow-500' : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            ⚙️ Admin / Caja
          </button>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleFormSubmit} className="p-8 space-y-5 bg-slate-900">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loginType === 'mesero' ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                Ingresa tu PIN de 6 dígitos
              </label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-[1em] text-3xl py-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors font-mono shadow-inner"
                maxLength={6}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-md cursor-pointer mt-2"
          >
            <LogIn className="w-5 h-5" />
            Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
};
