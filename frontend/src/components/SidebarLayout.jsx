import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import PerfilModal from './PerfilModal';

const SidebarLayout = ({ children }) => {
  const { usuario, cerrarSesion } = useAuth();
  const { tema, toggleTema } = useTheme();
  const navigate = useNavigate();
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--c-fondo)] transition-colors duration-500">

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--c-fondo-card)] border-b border-[var(--c-borde)] z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarAbierto(true)} className="p-2 -ml-2 text-[var(--c-texto)] rounded-lg hover:bg-[var(--c-secundario)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-[var(--c-primario)]">El Asesor</span>
        </div>
      </div>

      {/* Overlay para móvil */}
      {sidebarAbierto && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* Sidebar Izquierdo */}
      <aside
        className={`fixed md:relative top-0 left-0 w-72 h-full flex flex-col flex-shrink-0 z-50 border-r border-[var(--c-borde)] bg-[var(--c-fondo-card)] shadow-[4px_0_24px_var(--c-sombra)] transition-transform duration-300 ease-in-out ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <button 
          onClick={() => setSidebarAbierto(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-[var(--c-texto-sub)] hover:text-[var(--c-texto)] rounded-lg hover:bg-[var(--c-secundario)] z-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Efecto de Luz Superior (Glow) */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--c-accion)]/10 to-transparent pointer-events-none"></div>

        {/* Sección de Perfil - Formal & Premium */}
        <div className="p-10 pb-8 flex flex-col items-center relative z-10">
          <div
            className="relative group cursor-pointer mb-6"
            onClick={() => setModalPerfilAbierto(true)}
          >
            {/* Soft Glow Background */}
            <div className="absolute -inset-4 bg-[var(--c-accion-pastel)] rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* Contenedor del Avatar */}
            <div className="relative w-24 h-24 rounded-xl p-0.5 bg-white border border-[var(--c-borde)] shadow-sm transition-all duration-300">
              <div className="w-full h-full rounded-lg overflow-hidden bg-[var(--c-secundario)]">
                {usuario?.avatar ? (
                  <img src={usuario.avatar} alt="Perfil" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--c-accion)] opacity-20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[var(--c-entrada)] border-2 border-white rounded-full"></div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-[var(--c-primario)] font-black text-xl tracking-tight transition-colors">
              {usuario?.nombre?.split(' ')[0] || 'Usuario'}
            </h2>
            <div className="mt-2 px-2 py-0.5 border border-[var(--c-borde)] bg-[var(--c-secundario)] rounded-md">
              <p className="text-[var(--c-texto-sub)] text-[9px] uppercase tracking-widest font-bold">
                {usuario?.rol?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6 custom-scrollbar relative z-10">

          <div>
            <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-[var(--c-texto-sub)] mb-3 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-[var(--c-borde)]"></span>
              Menu Principal
            </p>
            <div className="space-y-1.5">
              <NavLink to="/dashboard" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive)}>
                <NavIcon isActive={window.location.pathname === '/dashboard'}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </NavIcon>
                Dashboard
              </NavLink>

              {usuario?.rol !== 'ADMINISTRADOR' && (
                <>
                  <NavLink to="/movimientos" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive)}>
                    <NavIcon isActive={window.location.pathname === '/movimientos'}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </NavIcon>
                    Movimientos
                  </NavLink>

                  <NavLink to="/cierres" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive)}>
                    <NavIcon isActive={window.location.pathname === '/cierres'}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </NavIcon>
                    Cierres
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {usuario?.rol === 'ADMINISTRADOR' && (
            <div>
              <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-[var(--c-texto-sub)] mb-3 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[var(--c-borde)]"></span>
                Configuración
              </p>
              <div className="space-y-1.5">
                <NavLink to="/admin?tab=usuarios" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive && window.location.search.includes('tab=usuarios'))}>
                  <NavIcon isActive={window.location.search.includes('tab=usuarios')}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </NavIcon>
                  Usuarios
                </NavLink>

                <NavLink to="/admin?tab=sedes" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive && window.location.search.includes('tab=sedes'))}>
                  <NavIcon isActive={window.location.search.includes('tab=sedes')}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </NavIcon>
                  Sedes
                </NavLink>

                <NavLink to="/admin?tab=cajas" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive && window.location.search.includes('tab=cajas'))}>
                  <NavIcon isActive={window.location.search.includes('tab=cajas')}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </NavIcon>
                  Tipos de Caja
                </NavLink>

                <NavLink to="/admin?tab=movimientos" onClick={() => setSidebarAbierto(false)} className={({ isActive }) => navLinkClasses(isActive && window.location.search.includes('tab=movimientos'))}>
                  <NavIcon isActive={window.location.search.includes('tab=movimientos')}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </NavIcon>
                  Aprobación Mov.
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--c-borde)] bg-[var(--c-fondo-card)] relative z-10">
          <div className="pt-2 flex gap-2">
            <button
              onClick={toggleTema}
              title={`Modo ${tema === 'claro' ? 'Oscuro' : 'Claro'}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--c-borde)] bg-[var(--c-secundario)] text-[var(--c-texto-sub)] hover:text-[var(--c-primario)] hover:border-[var(--c-primario)]/30 transition-all text-[10px] font-black uppercase tracking-wider"
            >
              {tema === 'claro' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
              <span className="hidden lg:inline">{tema === 'claro' ? 'Oscuro' : 'Claro'}</span>
            </button>

            <button
              onClick={handleCerrarSesion}
              title="Cerrar Sesión"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-[10px] font-black uppercase tracking-wider group"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="hidden lg:inline">Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 h-full pt-16 md:pt-0 overflow-y-auto relative z-10 bg-[var(--c-fondo)] custom-scrollbar transition-colors duration-500 w-full">
        {children}
      </main>

      {/* Modal de Perfil */}
      {modalPerfilAbierto && (
        <PerfilModal onClose={() => setModalPerfilAbierto(false)} />
      )}

    </div>
  );
};

/* Funciones auxiliares para simplificar el código del NavLink */
const navLinkClasses = (isActive) =>
  `group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-xs font-bold ${isActive
    ? 'bg-[var(--c-secundario)] text-[var(--c-primario)] border border-[var(--c-borde)]'
    : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)] hover:bg-[var(--c-secundario)]/40'
  }`;

const NavIcon = ({ isActive, children }) => (
  <div className={`p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[var(--c-accion)]' : 'text-[var(--c-texto-sub)] group-hover:text-[var(--c-accion)]'
    }`}>
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {children}
    </svg>
  </div>
);

export default SidebarLayout;