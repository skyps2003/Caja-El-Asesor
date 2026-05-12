import { useEffect, useRef } from 'react';
import 'cally';

/**
 * CallyCalendar — Diseño inspirado en shadcn CalendarWithPresets.
 * Card limpia + botones de acceso rápido en el footer.
 * Funcionalidad: selección de fecha, indicadores de actividad, presets rápidos.
 *
 * @param {string}   value          — Fecha seleccionada YYYY-MM-DD
 * @param {function} onChange       — Callback al seleccionar fecha
 * @param {object}   resumenDiario  — { 'YYYY-MM-DD': { ingresos, egresos } }
 */
const CallyCalendar = ({ value, onChange, resumenDiario = {} }) => {
  const calRef = useRef(null);

  // Escuchar evento nativo de Cally → propagar a React
  useEffect(() => {
    const el = calRef.current;
    if (!el) return;
    const handleChange = (e) => { if (e.target.value) onChange(e.target.value); };
    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, [onChange]);

  // Propagar value de React → web component
  useEffect(() => {
    const el = calRef.current;
    if (!el || !value) return;
    el.setAttribute('value', value);
  }, [value]);

  // Calcular fecha con offset de días y devolver YYYY-MM-DD
  const addDays = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const presets = [
    { label: 'Hoy',        offset: 0 },
    { label: 'Mañana',     offset: 1 },
    { label: '3 días',     offset: 3 },
    { label: '1 semana',   offset: 7 },
    { label: '2 semanas',  offset: 14 },
  ];

  // Contar días con actividad en el mes visible
  const diasConActividad = Object.keys(resumenDiario).filter(
    (f) => resumenDiario[f]?.ingresos > 0 || resumenDiario[f]?.egresos > 0
  ).length;

  return (
    <>
      {/* ── Estilos del web component Cally ── */}
      <style>{`
        calendar-date {
          --color-accent: #3B59DA;
          --color-text-on-accent: #ffffff;
          display: block;
          width: 100%;
        }

        /* Encabezado del mes */
        calendar-date .heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--c-primario);
        }

        /* Flechas prev/next */
        calendar-date button[slot="previous"],
        calendar-date button[slot="next"] {
          border-radius: 8px;
          padding: 0.3rem;
          color: var(--c-texto-sub);
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s;
          cursor: pointer;
        }
        calendar-date button[slot="previous"]:hover,
        calendar-date button[slot="next"]:hover {
          background: var(--c-secundario);
          border-color: var(--c-borde);
          color: var(--c-primario);
        }

        /* Nombres de días de la semana */
        calendar-month [part~="weekday"] {
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--c-texto-sub);
          opacity: 0.5;
          padding-bottom: 0.25rem;
        }

        /* Celdas de días */
        calendar-month [part~="day"] {
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--c-texto);
          transition: background 0.12s, color 0.12s;
          position: relative;
        }
        calendar-month [part~="day"]:hover {
          background: var(--c-secundario);
          color: var(--c-primario);
        }
        /* Día seleccionado */
        calendar-month [part~="day"][aria-selected="true"] {
          background: #3B59DA;
          color: #ffffff;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(59,89,218,0.30);
        }
        /* Día de hoy */
        calendar-month [part~="day"][aria-current="date"] {
          border: 1.5px solid #3B59DA;
          color: #3B59DA;
          font-weight: 800;
        }
        calendar-month [part~="day"][aria-current="date"][aria-selected="true"] {
          border-color: transparent;
          color: #fff;
        }
        /* Días fuera del mes */
        calendar-month [part~="day"][data-outside-month] {
          opacity: 0.25;
        }
      `}</style>

      {/* ── Card principal ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--c-fondo-card)',
          border: '1px solid var(--c-borde)',
          boxShadow: 'var(--c-sombra-soft)',
          maxWidth: 300,
        }}
      >
        {/* Cuerpo: Calendario Cally */}
        <div className="p-4">
          <calendar-date ref={calRef} value={value || ''}>
            {/* Flecha ← */}
            <button
              slot="previous"
              aria-label="Mes anterior"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg style={{ width: 13, height: 13 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Flecha → */}
            <button
              slot="next"
              aria-label="Mes siguiente"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg style={{ width: 13, height: 13 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <calendar-month></calendar-month>
          </calendar-date>

          {/* Indicador de actividad */}
          {diasConActividad > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B59DA] inline-block opacity-60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--c-texto-sub)] opacity-50">
                {diasConActividad} día{diasConActividad > 1 ? 's' : ''} con movimientos
              </span>
            </div>
          )}
        </div>

        {/* ── Footer con presets ── */}
        <div
          className="flex flex-wrap gap-2 p-3"
          style={{ borderTop: '1px solid var(--c-borde)' }}
        >
          {presets.map((p) => {
            const target = addDays(p.offset);
            const isActive = value === target;
            return (
              <button
                key={p.label}
                onClick={() => onChange(target)}
                style={{
                  flex: '1 1 auto',
                  padding: '0.3rem 0.5rem',
                  borderRadius: 8,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: isActive ? '#3B59DA' : 'var(--c-secundario)',
                  color: isActive ? '#ffffff' : 'var(--c-texto-sub)',
                  border: isActive ? '1px solid #3B59DA' : '1px solid var(--c-borde)',
                  boxShadow: isActive ? '0 2px 8px rgba(59,89,218,0.2)' : 'none',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CallyCalendar;
