import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const Dashboard = () => {
  const { usuario } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [resumenDiario, setResumenDiario] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const THEME_COLORS = ['#1A1A5A', '#3B59DA', '#2D47B8', '#4F6EF7', '#64748B', '#94A3B8'];

  const formatSol = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [sedesRes, cajasRes, diariosRes] = await Promise.all([
          usuario.rol === 'ADMINISTRADOR' ? API.get('/sedes') : API.get(`/sedes/${usuario.id_sede?._id || usuario.id_sede}`),
          usuario.rol === 'ADMINISTRADOR' ? API.get('/cajas') : API.get(`/cajas/sede/${usuario.id_sede?._id || usuario.id_sede}`),
          API.get('/cierres/resumen/diario?dias=31'),
        ]);
        
        setSedes(usuario.rol === 'ADMINISTRADOR' ? sedesRes.data : [sedesRes.data]);
        setCajas(cajasRes.data);
        
        const mapa = {};
        diariosRes.data.forEach((d) => { mapa[d.fecha] = d; });
        setResumenDiario(mapa);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [usuario]);

  const saldoTotal = cajas.reduce((acc, c) => acc + c.saldo_actual, 0);
  const getCajasPorSede = (sedeId) => cajas.filter((c) => (c.id_sede?._id || c.id_sede) === sedeId);
  const getSaldoTotalSede = (sedeId) => getCajasPorSede(sedeId).reduce((acc, c) => acc + c.saldo_actual, 0);

  const chartData = useMemo(() => {
    const detalle = resumenDiario[fechaSeleccionada]?.detalle_cajas;
    
    const emptyState = {
      inner: [{ name: 'Sin Movimientos', value: 1, color: 'var(--c-borde)' }],
      outer: []
    };

    if (!detalle || Object.keys(detalle).length === 0) return emptyState;

    let totalIngresos = 0;
    let totalEgresos = 0;
    let outer = [];

    if (usuario.rol === 'ADMINISTRADOR') {
      outer = sedes.map(s => {
        const cajasDeSede = getCajasPorSede(s._id);
        const inG = cajasDeSede.reduce((acc, c) => acc + (detalle[c._id]?.ingresos || 0), 0);
        const outG = cajasDeSede.reduce((acc, c) => acc + (detalle[c._id]?.egresos || 0), 0);
        totalIngresos += inG;
        totalEgresos += outG;
        
        let color = '#3B59DA';
        const n = s.nombre.toLowerCase();
        if (n.includes('abancay')) color = '#A855F7';
        else if (n.includes('challhuahuacho')) color = '#16A34A';
        
        return { name: s.nombre, value: inG + outG, ingresos: inG, egresos: outG, color };
      }).filter(d => d.value > 0);
    } else {
      outer = cajas.map(c => {
        const inG = detalle[c._id]?.ingresos || 0;
        const outG = detalle[c._id]?.egresos || 0;
        totalIngresos += inG;
        totalEgresos += outG;
        
        let color = c.color_primario || '#3B59DA'; // Azul Cobalto Vibrante
        const n = c.nombre_caja.toLowerCase();
        if (n.includes('efectivo')) color = '#22C55E';
        else if (n.includes('bbva') || n.includes('continental')) color = '#2563EB';
        else if (n.includes('interbank')) color = '#FACC15';
        else if (n.includes('nacion')) color = '#DC2626';
        else if (n.includes('bcp') || n.includes('credito')) color = '#7C3AED';
        
        return { name: c.nombre_caja, value: inG + outG, ingresos: inG, egresos: outG, color };
      }).filter(d => d.value > 0);
    }

    if (totalIngresos === 0 && totalEgresos === 0) return emptyState;

    const inner = [
      { name: 'Total Ingresos', value: totalIngresos, color: 'var(--c-entrada)' },
      { name: 'Total Egresos', value: totalEgresos, color: 'var(--c-salida)' }
    ].filter(d => d.value > 0);

    return { inner, outer };
  }, [sedes, cajas, usuario.rol, fechaSeleccionada, resumenDiario]);

  const renderCalendario = () => {
    const fBase = fechaSeleccionada ? new Date(fechaSeleccionada + 'T12:00:00') : new Date();
    const anio = fBase.getFullYear();
    const mes = fBase.getMonth();
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    const dias = [];
    const startOffset = primerDia === 0 ? 6 : primerDia - 1;
    for (let i = 0; i < startOffset; i++) dias.push(null);
    for (let i = 1; i <= diasEnMes; i++) dias.push(i);

    return (
      <div className="w-full">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={`dow-${i}`} className="text-[8px] font-black text-[var(--c-texto-sub)] text-center py-1 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="h-7" />;
            const f = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSel = fechaSeleccionada === f;
            const isToday = new Date().getDate() === d && new Date().getMonth() === mes;
            const hasData = resumenDiario[f]?.ingresos > 0 || resumenDiario[f]?.egresos > 0;
            return (
              <button
                key={i}
                onClick={() => setFechaSeleccionada(f)}
                className={`h-7 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center relative
                  ${isSel ? 'bg-[var(--c-accion)] text-white shadow-lg' : 'hover:bg-[var(--c-borde)] text-[var(--c-texto)] bg-[var(--c-secundario)]/50'}
                  ${isToday && !isSel ? 'border border-[var(--c-accion)] text-[var(--c-accion)]' : ''}
                `}
              >
                {d}
                {hasData && !isSel && <div className="absolute bottom-1 w-1 h-1 bg-[var(--c-accion)] rounded-full opacity-40"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (cargando) return <Loader mensaje="Preparando Panel de Control..." />;

  return (
    <div className="min-h-screen bg-fondo animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-heading text-primario mb-2">
            Panel de Operaciones
          </h1>
          <p className="text-texto-sub font-medium flex items-center gap-3">
            <span>Estudio Contable El Asesor</span>
            <span className="w-1 h-1 bg-[var(--c-borde)] rounded-full"></span>
            <span className="text-[var(--c-accion)] font-bold">
              {usuario.rol === 'ADMINISTRADOR' ? 'Administración Central' : (sedes[0]?.nombre || 'Sede Local')}
            </span>
            {usuario.rol !== 'ADMINISTRADOR' && sedes[0]?.direccion && (
              <>
                <span className="w-1 h-1 bg-[var(--c-borde)] rounded-full"></span>
                <span className="text-[10px] uppercase tracking-widest opacity-60">{sedes[0].direccion}</span>
              </>
            )}
          </p>
        </div>

        {/* Top Stats - Formal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--c-accion-pastel)] rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-accion)] mb-2">Capital Total</p>
              <p className="text-4xl font-black font-heading text-[var(--c-primario)] tracking-tight">{formatSol(saldoTotal)}</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[var(--c-entrada)] bg-[var(--c-success-pastel)] w-fit px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 bg-[var(--c-entrada)] rounded-full animate-pulse"></span>
                SISTEMA ACTIVO
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-texto-sub)] mb-2">Saldo Neto Diario</p>
              <p className={`text-4xl font-black font-heading tracking-tight ${((resumenDiario[fechaSeleccionada]?.ingresos || 0) - (resumenDiario[fechaSeleccionada]?.egresos || 0)) >= 0 ? 'text-[var(--c-entrada)]' : 'text-[var(--c-salida)]'}`}>
                {formatSol((resumenDiario[fechaSeleccionada]?.ingresos || 0) - (resumenDiario[fechaSeleccionada]?.egresos || 0))}
              </p>
              <p className="mt-4 text-[11px] font-medium text-[var(--c-texto-sub)]">Balance de operaciones del día</p>
            </div>
          </div>

          <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-texto-sub)] mb-2">Cajas Habilitadas</p>
              <p className="text-4xl font-black font-heading text-[var(--c-primario)] tracking-tight">{cajas.length}</p>
              <p className="mt-4 text-[11px] font-medium text-[var(--c-texto-sub)]">Puntos de control financiero</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="premium-card h-[400px] flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--c-accion)] mb-6">
              {usuario.rol === 'ADMINISTRADOR' ? 'Volumen Operativo por Sede' : 'Actividad Diaria por Caja'}
            </h3>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              {chartData.inner[0].name === 'Sin Movimientos' ? (
                <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                   <svg className="w-12 h-12 mb-3 text-[var(--c-texto-sub)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                   <p className="text-xs font-bold text-[var(--c-texto-sub)] uppercase tracking-widest">Sin Movimientos</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ background: 'var(--c-fondo-card)', border: '1px solid var(--c-accion)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: 'var(--c-texto)' }}
                      formatter={(value, name, props) => {
                        if (name.includes('Total')) return [`S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, name];
                        return [
                          `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })} (Ing: S/${props.payload.ingresos} | Egr: S/${props.payload.egresos})`,
                          name
                        ];
                      }}
                    />
                    <Pie 
                      data={chartData.inner} 
                      cx="50%" cy="50%" 
                      innerRadius={45} outerRadius={65} 
                      dataKey="value" stroke="none"
                    >
                      {chartData.inner.map((entry, i) => <Cell key={`inner-${i}`} fill={entry.color} />)}
                    </Pie>
                    <Pie 
                      data={chartData.outer} 
                      cx="50%" cy="50%" 
                      innerRadius={75} outerRadius={110} 
                      paddingAngle={4} dataKey="value" stroke="none"
                    >
                      {chartData.outer.map((entry, i) => <Cell key={`outer-${i}`} fill={entry.color} />)}
                    </Pie>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="premium-card h-[400px] flex flex-col">
            {usuario.rol === 'ADMINISTRADOR' ? (
              <>
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--c-accion)] mb-6">Estado de Sedes</h3>
                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {sedes.map(s => {
                    const total = getSaldoTotalSede(s._id);
                    const inferior = total < 500;
                    return (
                      <div key={s._id} className="p-4 bg-secundario rounded-xl mb-4 border border-[var(--c-accion)]/5 flex justify-between items-center transition-all hover:border-[var(--c-accion)]/30">
                        <div>
                          <p className="font-bold text-primario">{s.nombre}</p>
                          <p className="text-[10px] text-texto-sub uppercase font-bold">{s.direccion}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-black ${inferior ? 'text-salida' : 'text-entrada'}`}>{formatSol(total)}</p>
                          {inferior && <p className="text-[9px] text-salida font-bold uppercase animate-pulse">Bajo Mínimo</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--c-accion)]">Calendario de Actividad</h3>
                  {fechaSeleccionada === (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })() && (
                    <span className="flex items-center gap-1.5 text-[8px] font-black text-[var(--c-entrada)] bg-[var(--c-success-pastel)] px-2 py-0.5 rounded-full animate-pulse">
                      <span className="w-1 h-1 bg-[var(--c-entrada)] rounded-full"></span>
                      EN VIVO
                    </span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="mb-8">
                    {renderCalendario()}
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Ingresos del Día', val: resumenDiario[fechaSeleccionada]?.ingresos || 0, col: 'var(--c-entrada)' },
                      { label: 'Egresos del Día', val: resumenDiario[fechaSeleccionada]?.egresos || 0, col: 'var(--c-salida)' },
                      { label: 'Balance Neto', val: (resumenDiario[fechaSeleccionada]?.ingresos || 0) - (resumenDiario[fechaSeleccionada]?.egresos || 0), col: 'var(--c-accion)' }
                    ].map(stat => (
                      <div key={stat.label} className="px-4 py-3 rounded-2xl border border-[var(--c-borde)] bg-[var(--c-fondo)] flex justify-between items-center shadow-inner group hover:border-[var(--c-accion)]/20 transition-all">
                        <p className="text-[8px] font-black uppercase tracking-widest text-[var(--c-texto-sub)]">{stat.label}</p>
                        <p className="text-sm font-black font-heading" style={{ color: stat.col }}>{formatSol(stat.val)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[8px] text-[var(--c-texto-sub)] font-bold uppercase text-center opacity-40 italic">
                    Seleccione un día del grid para auditar cambios
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Sede List */}
        <div className="space-y-10">
          {sedes.map(sede => (
            <div key={sede._id} className="animate-slide-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1.5 h-8 bg-[var(--c-accion)] rounded-full" />
                <h2 className="text-2xl font-heading text-primario">{sede.nombre}</h2>
                <div className="flex-1 h-px bg-[var(--c-accion)]/10 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {getCajasPorSede(sede._id).map(caja => {
                  const pct = caja.saldo_maximo > 0 ? Math.round((caja.saldo_actual / caja.saldo_maximo) * 100) : 0;
                  const inferior = caja.saldo_actual < caja.saldo_minimo;
                  return (
                    <div key={caja._id} className="premium-card border-[var(--c-accion)]/5 hover:border-[var(--c-accion)]/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-[var(--c-accion)] uppercase tracking-widest mb-1">{caja.codigo}</p>
                          <h4 className="font-bold text-primario">{caja.nombre_caja}</h4>
                        </div>
                        {usuario.rol !== 'ADMINISTRADOR' && (
                          <Link to={`/movimientos?caja=${caja._id}`} className="p-2 hover:bg-[var(--c-accion)]/10 rounded-lg text-[var(--c-accion)] transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </Link>
                        )}
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] text-texto-sub uppercase font-bold">Saldo Actual</span>
                          <span className={`text-xl font-black ${inferior ? 'text-salida' : 'text-entrada'}`}>{formatSol(caja.saldo_actual)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-borde rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--c-accion)] transition-all duration-1000" 
                            style={{ width: `${Math.min(100, pct)}%` }} 
                          />
                        </div>
                      </div>

                      {inferior && (
                        <div className="p-2 bg-salida/10 rounded-lg border border-salida/20 text-center mb-4">
                          <p className="text-[9px] text-salida font-bold uppercase tracking-tighter">Alerta de liquidez mínima</p>
                        </div>
                      )}

                      <div className="flex justify-between pt-4 border-t border-borde text-[10px] font-bold text-texto-sub uppercase">
                        <span>Min: {formatSol(caja.saldo_minimo)}</span>
                        <span>Max: {formatSol(caja.saldo_maximo)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;