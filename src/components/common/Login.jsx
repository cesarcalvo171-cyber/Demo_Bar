import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBar } from "../../context/BarContext";
import { Lock, User, LogIn, AlertCircle } from "lucide-react";
import { MdRestaurant } from "react-icons/md";

export const Login = () => {
  const { login, loginMesero } = useBar();
  const navigate = useNavigate();

  //manejo de estados para login
  const [step, setStep] = useState(1);
  const [loginType, setLoginType] = useState("mesero");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  //funcion, clic en en un perfil
  const handleSelectprofile = (type) => {
    setLoginType(type);
    setErrorMsg("");
    setStep(2); //avanzamos al formulario de login
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    let res;
    if (loginType === "mesero") {
      if (!pin.trim()) {
        setErrorMsg("Debes ingresar tu PIN");
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
    if (res.user.role === "admin") navigate("/admin");
    else if (res.user.role === "cajero") navigate("/cajero");
    else navigate("/mesero");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans ">
      {/* Card principal del login */}
      <div className="bg-slate-950 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header del login */}
        <div className="pt-10 pb-6 text-center px-8 ">
          <div className="w-14 h-14 bg-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-yellow-500">
            <MdRestaurant className="w-8 h-8" />
          </div>
        </div>
        {/*Cabezera del step */}
        <h1 className="text-center text-2xl font-bold text-yellow-500 m-0">
          {step === 1 ? "Selecciona tu perfil" : "Iniciar Sesión"}
        </h1>
        <p className="text-sm text-yellow-500 mt-2 text-center">
          {step === 1
            ? "Elige cómo deseas ingresar a la plataforma hoy."
            : "Ingresa tus credenciales de acceso."}
        </p>
         {/* Contenido del step */}
      <div className="px-8 pb-10">
        {step === 1 ? (
          <div className=" space-y-3 ">
            <button
              type="button"
              onClick={() => handleSelectprofile("admin")}
              className="w-full mt-4  p-4 rounded-2xl text-center border-2 border-transparent bg-white hover:bg-yellow-100 shadow-2xl transition-all  gap-4 group cursor-pointer"
            >
              <div>
                <h3 className="font-bold text-slate-950 text-sm ">Administrador</h3>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectprofile("cajero")}
              className="w-full text-center p-4 rounded-2xl border-2 border-transparent bg-white hover:bg-yellow-100  shadow-2xl transition-all  group cursor-pointer"
            >
              <div>
                <h3 className="font-bold text-slate-950 text-sm text-center">Cajero</h3>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectprofile("mesero")}
              className="w-full  p-4 rounded-2xl border-2 border-transparent bg-white hover:bg-yellow-100  shadow-2xl transition-all text-center group cursor-pointer"
            >
              <div>
                <h3 className="font-bold text-slate-950 text-sm ">Mesero</h3>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {loginType === "mesero" ? (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                  PIN de Seguridad (6 dígitos)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full text-center tracking-[1em] text-3xl py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-yellow-500/30 transition-colors font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Usuario</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-yellow-500/30 transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-nonefocus:border-yellow-500/30 transition-colors font-mono"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setStep(1); setErrorMsg(""); }}
                className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Entrar
              </button>
            </div>
          </form>
        )}
      </div>

      </div>
      
     
    </div>
  );
};
