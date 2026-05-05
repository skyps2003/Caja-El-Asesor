import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- ICONOS ---
const SedeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);
const CajaIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);
const SaldoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const TendenciaIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ icon: Icon, label, value, color, delay = '' }) => (
  <div className={`stat-card animate-fadeIn ${delay}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <div style={{ color }}><Icon /></div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-texto-sub)' }}>{label}</p>
    </div>
    <p className="text-3xl font-bold" style={{ color }}>{value}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataExtra = payload[0].payload;
    return (
      <div className="p-3 rounded-xl border" style={{ background: 'var(--c-fondo-card)', borderColor: 'var(--c-borde)', boxShadow: '0 10px 25px var(--c-sombra)' }}>
        {/* Mostramos "001 - Nombre de la Caja" */}
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--c-primario)' }}>
          {label} - {dataExtra.nombreCompleto}
        </p>

        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span style={{ color: 'var(--c-texto-sub)' }}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: 'var(--c-texto)' }}>
              S/ {Number(entry.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { usuario } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [resumenDiario, setResumenDiario] = useState({}); // { 'YYYY-MM-DD': { ingresos, egresos, neto } }
  const [resumenMensual, setResumenMensual] = useState([]);

  // Fecha seleccionada en el calendario
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const COLORS = ['#3B59DA', '#16A34A', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        if (usuario.rol === 'ADMINISTRADOR') {
          const [sedesRes, cajasRes] = await Promise.all([
            API.get('/sedes'),
            API.get('/cajas'),
          ]);
          setSedes(sedesRes.data);
          setCajas(cajasRes.data);
        } else {
          const [sedeRes, cajasRes] = await Promise.all([
            API.get(`/sedes/${usuario.id_sede._id || usuario.id_sede}`),
            API.get(`/cajas/sede/${usuario.id_sede._id || usuario.id_sede}`),
          ]);
          setSedes([sedeRes.data]);
          setCajas(cajasRes.data);
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [usuario]);

  // Cargar resúmenes de movimientos por día y mes
  useEffect(() => {
    const cargarResumenes = async () => {
      try {
        const [diariosRes, mensualRes] = await Promise.all([
          API.get('/cierres/resumen/diario?dias=31'),
          API.get('/cierres/resumen/mensual'),
        ]);
        // Convertir array a mapa { 'YYYY-MM-DD': { ingresos, egresos } }
        const mapa = {};
        diariosRes.data.forEach((d) => { mapa[d.fecha] = d; });
        setResumenDiario(mapa);
        setResumenMensual(mensualRes.data);
      } catch (err) {
        console.error('Error al cargar resúmenes:', err);
      }
    };
    cargarResumenes();
    const interval = setInterval(cargarResumenes, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  const getCajasPorSede = (sedeId) => cajas.filter((c) => (c.id_sede?._id || c.id_sede) === sedeId);
  const getSaldoTotalSede = (sedeId) => getCajasPorSede(sedeId).reduce((acc, c) => acc + c.saldo_actual, 0);
  const saldoTotal = cajas.reduce((acc, c) => acc + c.saldo_actual, 0);
  const formatSol = (n) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  const getSaldoPct = (caja) => caja.saldo_maximo > 0 ? Math.min(100, Math.round((caja.saldo_actual / caja.saldo_maximo) * 100)) : 0;

  // --- DATOS DE GRÁFICOS ---
  const dataPie = useMemo(() => {
    if (usuario.rol === 'ADMINISTRADOR') {
      return sedes.map(sede => ({ name: sede.nombre, value: getSaldoTotalSede(sede._id) })).filter(item => item.value > 0);
    } else {
      return cajas.map(caja => ({ name: caja.nombre_caja, value: caja.saldo_actual })).filter(item => item.value > 0);
    }
  }, [sedes, cajas, usuario.rol]);

  const dataBar = useMemo(() => {
    return cajas.map(caja => ({
      name: caja.codigo, // <--- Esto es lo que saldrá en el eje X (ej. 001)
      nombreCompleto: caja.nombre_caja, // <--- Guardamos el nombre para la leyenda extra
      Actual: caja.saldo_actual,
      Máximo: caja.saldo_maximo
    }));
  }, [cajas]);

  // --- LÓGICA DEL CALENDARIO ---
  const generarDiasCalendario = () => {
    const fechaActual = new Date();
    const mes = fechaActual.getMonth();
    const año = fechaActual.getFullYear();

    // Primer día del mes (0 = Domingo, 1 = Lunes, etc.)
    const primerDia = new Date(año, mes, 1).getDay();
    // Total de días en el mes
    const diasEnMes = new Date(año, mes + 1, 0).getDate();

    const dias = [];
    // Espacios vacíos antes del primer día
    for (let i = 0; i < primerDia; i++) {
      dias.push(null);
    }
    // Días del mes
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push(new Date(año, mes, i));
    }
    return dias;
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasCalendario = generarDiasCalendario();
  const hoy = new Date();

  if (cargando) {
    return <Loader mensaje="Cargando Dashboard..." />;
  }

  return (
    <>
      <main className="min-h-screen" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded-full" style={{ background: 'var(--c-accion)' }} />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--c-primario)' }}>
                {usuario.rol === 'ADMINISTRADOR' ? 'Panel de Administración' : 'Mi Sede'}
              </h1>
            </div>
            <p className="text-sm ml-4" style={{ color: 'var(--c-texto-sub)' }}>
              {usuario.rol === 'ADMINISTRADOR'
                ? `Vista general — ${sedes.length} sede(s) activas`
                : 'Resumen de operaciones de tu sede asignada'}
            </p>
          </div>

          {/* Stats Principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={SedeIcon} label="Sedes" value={sedes.length} color="var(--c-primario)" delay="delay-100" />
            <StatCard icon={CajaIcon} label="Cajas" value={cajas.length} color="var(--c-accion)" delay="delay-200" />

            <div className="col-span-2">
              <div className="stat-card animate-fadeIn delay-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.12)' }}>
                      <div style={{ color: 'var(--c-entrada)' }}><SaldoIcon /></div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-texto-sub)' }}>
                      Saldo Total Sistema
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--c-entrada)' }}>
                    <TendenciaIcon />
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--c-entrada)' }}>
                  {formatSol(saldoTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Sedes y Cajas (Tabla) */}
          <div className="space-y-6 mb-8">
            {sedes.map((sede, idx) => (
              <div
                key={sede._id}
                className={`card-secundario p-6 animate-fadeIn`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Encabezado de sede */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${sede.estado ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ boxShadow: sede.estado ? '0 0 0 3px rgba(22,163,74,0.2)' : '0 0 0 3px rgba(220,38,38,0.2)' }}
                    />
                    <div>
                      <h2 className="text-base font-bold" style={{ color: 'var(--c-primario)' }}>
                        {sede.nombre}
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--c-texto-sub)' }}>{sede.direccion}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--c-texto-sub)' }}>
                      Total Sede
                    </p>
                    <p className="text-xl font-bold" style={{ color: 'var(--c-primario)' }}>
                      {formatSol(getSaldoTotalSede(sede._id))}
                    </p>
                  </div>
                </div>

                {/* Tabla de cajas */}
                <div className="table-wrapper">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80">Código</th>
                          <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80">Nombre</th>
                          <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80">Saldo Min.</th>
                          <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80">Saldo Máx.</th>
                          <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80">Saldo Actual</th>
                          <th className="text-center py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80 hidden sm:table-cell">Nivel</th>
                          <th className="text-center py-3 px-4 font-medium text-xs uppercase tracking-wide opacity-80">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCajasPorSede(sede._id).length > 0 ? (
                          getCajasPorSede(sede._id).map((caja) => {
                            const pct = getSaldoPct(caja);
                            const pctColor = pct < 20 ? 'var(--c-salida)' : pct < 50 ? '#F59E0B' : 'var(--c-entrada)';
                            return (
                              <tr key={caja._id} className="table-row">
                                <td className="py-3 px-4 font-mono font-bold text-xs" style={{ color: 'var(--c-accion)' }}>
                                  {caja.codigo}
                                </td>
                                <td className="py-3 px-4 font-medium" style={{ color: 'var(--c-texto)' }}>
                                  {caja.nombre_caja}
                                </td>
                                <td className="py-3 px-4 text-right text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                                  {formatSol(caja.saldo_minimo)}
                                </td>
                                <td className="py-3 px-4 text-right text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                                  {formatSol(caja.saldo_maximo)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold" style={{ color: 'var(--c-primario)' }}>
                                  {formatSol(caja.saldo_actual)}
                                </td>
                                <td className="py-3 px-4 hidden sm:table-cell">
                                  <div className="flex items-center gap-2">
                                    <div className="progress-bar flex-1" style={{ minWidth: '60px' }}>
                                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pctColor }} />
                                    </div>
                                    <span className="text-xs font-semibold w-8 text-right" style={{ color: pctColor }}>{pct}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Link
                                    to={`/movimientos?caja=${caja._id}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                    style={{ background: 'var(--c-accion)', color: '#fff' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-accion-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--c-accion)'}
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Movimiento
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-sm" style={{ color: 'var(--c-texto-sub)' }}>
                              No hay cajas registradas en esta sede
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}

            {sedes.length === 0 && (
              <div className="text-center py-20 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--c-secundario)' }}>
                  <SedeIcon />
                </div>
                <p className="text-lg font-medium" style={{ color: 'var(--c-texto-sub)' }}>No hay sedes disponibles</p>
                <p className="text-sm mt-1" style={{ color: 'var(--c-texto-sub)', opacity: 0.6 }}>Contacta al administrador del sistema</p>
              </div>
            )}
          </div>

          {/* --- VISTA CONDICIONAL: CALENDARIO O GRÁFICOS (AL FINAL) --- */}
          {!fechaSeleccionada ? (
            <div className="card-secundario p-8 mt-8 animate-fadeIn delay-400">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--c-primario)' }}>
                  {meses[hoy.getMonth()]} {hoy.getFullYear()}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--c-texto-sub)' }}>
                  Selecciona un día para ver los gráficos de operaciones
                </p>
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-2">
                {diasSemana.map(dia => (
                  <div key={dia} className="text-center text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--c-texto-sub)' }}>
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {diasCalendario.map((fecha, idx) => {
                  if (!fecha) {
                    return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl" style={{ background: 'var(--c-fondo)', opacity: 0.3 }}></div>;
                  }

                  const esHoy = fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth();
                  const isoFecha = fecha.toISOString().split('T')[0];
                  const datos = resumenDiario[isoFecha];
                  const tieneIngresos = datos?.ingresos > 0;
                  const tieneEgresos = datos?.egresos > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => setFechaSeleccionada(fecha)}
                      className="relative h-16 sm:h-20 rounded-xl flex flex-col items-center justify-center border transition-all duration-200 cursor-pointer group hover:scale-105"
                      style={{
                        background: esHoy ? 'var(--c-accion)' : 'var(--c-fondo-card)',
                        borderColor: esHoy ? 'var(--c-accion)' : datos ? 'rgba(59,89,218,0.2)' : 'var(--c-borde)',
                        color: esHoy ? '#fff' : 'var(--c-texto)'
                      }}
                    >
                      <span className={`font-bold ${esHoy ? 'text-xl' : 'text-base'}`}>{fecha.getDate()}</span>

                      {/* Puntos de actividad */}
                      {!esHoy && (tieneIngresos || tieneEgresos) && (
                        <div className="flex gap-1 mt-1">
                          {tieneIngresos && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-entrada)' }} />}
                          {tieneEgresos && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-salida)' }} />}
                        </div>
                      )}

                      {!esHoy && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: 'inset 0 0 0 2px var(--c-accion)' }}></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-entrada)' }} />
                  Ingresos
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-salida)' }} />
                  Egresos
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-accion)' }} />
                  Hoy
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 animate-fadeIn">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--c-primario)' }}>
                    {fechaSeleccionada.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                  {(() => {
                    const iso = fechaSeleccionada.toISOString().split('T')[0];
                    const d = resumenDiario[iso];
                    return d ? (
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--c-entrada)' }}>Ingresos: S/ {d.ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--c-salida)' }}>Egresos: S/ {d.egresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs font-bold" style={{ color: d.neto >= 0 ? 'var(--c-entrada)' : 'var(--c-salida)' }}>Neto: S/ {d.neto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs" style={{ color: 'var(--c-texto-sub)' }}>{d.movimientos} movimientos</span>
                      </div>
                    ) : (
                      <p className="text-xs mt-1" style={{ color: 'var(--c-texto-sub)' }}>Sin movimientos registrados en este día.</p>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setFechaSeleccionada(null)}
                  className="btn-primario flex items-center gap-2 text-xs cursor-pointer"
                  style={{ background: 'var(--c-secundario)', color: 'var(--c-texto)', boxShadow: 'none', border: '1px solid var(--c-borde)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al calendario
                </button>
              </div>

              {/* Contenedor de los Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Gráfico Circular */}
                <div className="card-secundario p-6 flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--c-texto-sub)' }}>
                    {usuario.rol === 'ADMINISTRADOR' ? 'Distribución por Sede' : 'Distribución por Caja'}
                  </h3>
                  <div className="flex-1 min-h-[300px]">
                    {dataPie.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dataPie} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                            {dataPie.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--c-texto)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--c-texto-sub)' }}>No hay saldos registrados para graficar.</div>
                    )}
                  </div>
                </div>

                {/* --- GRÁFICO DE BARRAS ACTUALIZADO --- */}
                <div className="card-secundario p-6 flex flex-col h-full">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--c-texto-sub)' }}>
                    Capacidad de Cajas (Actual vs Máx)
                  </h3>
                  <div className="flex-1 flex flex-col min-h-[350px]">
                    {dataBar.length > 0 ? (
                      <>
                        <div className="w-full h-full min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataBar} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-borde)" opacity={0.3} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 13, fill: 'var(--c-texto-sub)', fontWeight: '600' }} 
                                dy={15} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: 'var(--c-texto-sub)' }} 
                                width={60}
                                tickFormatter={(value) => `S/ ${value}`}
                              />
                              <Tooltip 
                                content={<CustomTooltip />} 
                                cursor={{ fill: 'var(--c-borde)', opacity: 0.15 }} 
                              />
                              <Bar 
                                dataKey="Actual" 
                                fill="var(--c-accion)" 
                                radius={[6, 6, 0, 0]} 
                                maxBarSize={45} 
                              />
                              <Bar 
                                dataKey="Máximo" 
                                fill="var(--c-borde)" 
                                radius={[6, 6, 0, 0]} 
                                maxBarSize={45} 
                                opacity={0.3} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--c-texto-sub)' }}>
                        No hay cajas para mostrar.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
};

export default Dashboard;