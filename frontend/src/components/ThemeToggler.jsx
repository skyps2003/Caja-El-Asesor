import { useTheme } from '../context/ThemeContext';
import { useRef } from 'react';

/**
 * AnimatedThemeToggler — inspirado en Magic UI, con colores de El Asesor.
 * Usa la View Transitions API para una transición fluida circular entre temas.
 */
const ThemeToggler = ({ className = '' }) => {
  const { tema, toggleTema } = useTheme();
  const btnRef = useRef(null);

  const handleToggle = async () => {
    // Si el navegador soporta View Transitions, usamos el efecto círculo
    if (!document.startViewTransition) {
      toggleTema();
      return;
    }

    const btn = btnRef.current;
    const { top, left, width, height } = btn.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;

    // Radio máximo desde el botón hasta la esquina más lejana
    const right = window.innerWidth - x;
    const bottom = window.innerHeight - y;
    const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

    const isDark = tema === 'oscuro';

    await document.startViewTransition(() => {
      toggleTema();
    }).ready;

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${maxRadius}px at ${x}px ${y}px)`,
    ];

    document.documentElement.animate(
      { clipPath: isDark ? clipPath : [...clipPath].reverse() },
      {
        duration: 500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: isDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
      }
    );
  };

  const isDark = tema === 'oscuro';

  return (
    <button
      ref={btnRef}
      onClick={handleToggle}
      title={isDark ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
      className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B59DA] ${className}`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1A1A5A 0%, #212140 100%)'
          : 'linear-gradient(135deg, #3B59DA 0%, #2D47B8 100%)',
        boxShadow: isDark
          ? '0 0 0 1px #2A2A54, 0 4px 12px rgba(0,0,0,0.4)'
          : '0 0 0 1px rgba(59,89,218,0.3), 0 4px 12px rgba(59,89,218,0.25)',
      }}
    >
      {/* Glow ring on hover */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, rgba(89,116,230,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Icon container - flips on change */}
      <span
        className="relative z-10 flex items-center justify-center w-6 h-6 transition-all duration-500"
        style={{ transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(1)' }}
      >
        {isDark ? (
          // Moon icon — modo oscuro activo
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Sun icon — modo claro activo
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeToggler;
