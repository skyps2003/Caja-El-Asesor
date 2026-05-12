import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import ThemeToggler from '../components/ThemeToggler';

const Login = () => {
  const [loginUsuario, setLoginUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const { tema } = useTheme();

  const logoSrc = tema === 'claro'
    ? '/Logo para claro.png'
    : '/Logo para oscuro.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data } = await API.post('/auth/login', {
        login_usuario: loginUsuario,
        password,
      });
      iniciarSesion(data);
      toast.success('¡Bienvenido al sistema!');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.mensaje || 'Error de conexión. Intente nuevamente.';
      toast.error(errorMsg, { duration: 7000 });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">

      {/* Animated Theme Toggle */}
      <div className="fixed top-8 right-8 z-[100]">
        <ThemeToggler />
      </div>

      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--c-accion)]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--c-accion)]/5 rounded-full blur-[150px]" />

      <div className="w-full max-w-md animate-fade-in relative z-10">

        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <img src={logoSrc} alt="Estudio Contable El Asesor" className="mx-auto h-36 w-auto" />
          </div>
        </div>

        {/* Login Card */}
        <div className="premium-card !p-10 border-[var(--c-borde)]">
          <h2 className="text-xl font-heading mb-8 text-[var(--c-primario)] text-center">Acceso al Sistema</h2>

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
            © 2026 Estudio Juridico Contable El Asesor SAC
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
