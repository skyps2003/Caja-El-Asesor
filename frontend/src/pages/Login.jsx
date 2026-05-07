import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

const Login = () => {
  const [loginUsuario, setLoginUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const { tema, toggleTema } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { data } = await API.post('/auth/login', {
        login_usuario: loginUsuario,
        password,
      });
      iniciarSesion(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Credenciales inválidas. Verifique sus datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTema}
        className="fixed top-8 right-8 z-[100] p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-xl group"
        title={tema === 'claro' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
      >
        {tema === 'claro' ? (
          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        ) : (
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        )}
      </button>

      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--c-accion)]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--c-accion)]/5 rounded-full blur-[150px]" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-[var(--c-fondo-card)] rounded-3xl mb-6 border border-[var(--c-borde)] shadow-sm">
            <svg className="w-12 h-12 text-[var(--c-primario)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading text-[var(--c-primario)] tracking-tight">Estudio Contable El Asesor</h1>
          <p className="text-[var(--c-accion)] font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Cash Management System</p>
        </div>

        {/* Login Card */}
        <div className="premium-card !p-10 border-[var(--c-borde)]">
          <h2 className="text-xl font-heading mb-8 text-[var(--c-primario)] text-center">Acceso al Sistema</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-xs font-bold bg-salida/10 border border-salida/20 text-salida animate-slide-up text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[var(--c-texto-sub)] uppercase tracking-widest mb-2">Usuario</label>
              <div className="relative">
                <input
                  type="text"
                  value={loginUsuario}
                  onChange={(e) => setLoginUsuario(e.target.value)}
                  className="premium-input !pl-12"
                  placeholder="Ej: admin_jjja"
                  required
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-accion)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--c-texto-sub)] uppercase tracking-widest mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="premium-input !pl-12 !pr-12"
                  placeholder="••••••••"
                  required
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-accion)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-texto-sub hover:text-[var(--c-accion)] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="btn-gold w-full py-4 text-base tracking-widest uppercase font-black shadow-lg"
            >
              {cargando ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-[var(--c-texto-sub)] font-bold uppercase tracking-widest opacity-40">
            © 2026 Corporación Interoceánica JJJA S.R.L.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
