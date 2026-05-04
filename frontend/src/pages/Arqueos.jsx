import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const formatSol = (n) =>
  `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

const getEstadoClase = (estado) => {
  switch (estado) {
    case 'CUADRADO': return 'badge-cuadrado';
    case 'SOBRANTE':  return 'badge-sobrante';
    case 'FALTANTE':  return 'badge-faltante';
    default:          return '';
  }
};

const Arqueos = () => {
  const { usuario } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [arqueos, setArqueos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoData, setCargandoData] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    id_sede: '',
    saldo_fisico: '',
    observaciones: '',
  });

  const cargarDatos = async () => {
    try {
      const [sedesRes, arqueosRes] = await Promise.all([
        usuario.rol === 'ADMINISTRADOR'
          ? API.get('/sedes')
          : API.get(`/sedes/${usuario.id_sede._id || usuario.id_sede}`),
        API.get('/arqueos'),
      ]);
      setSedes(usuario.rol === 'ADMINISTRADOR' ? sedesRes.data : [sedesRes.data]);
      setArqueos(arqueosRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoData(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 10000); // Polling cada 10 segundos
    return () => clearInterval(interval);
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setCargando(true);
    try {
      const { data } = await API.post('/arqueos', {
        id_sede: formData.id_sede,
        id_usuario: usuario._id,
        saldo_fisico: parseFloat(formData.saldo_fisico),
        observaciones: formData.observaciones,
      });
      setMensaje({
        tipo: 'exito',
        texto: `Arqueo registrado: ${data.arqueo.estado} — Diferencia: ${formatSol(data.arqueo.diferencia)}`,
      });
      setFormData({ id_sede: '', saldo_fisico: '', observaciones: '' });
      const res = await API.get('/arqueos');
      setArqueos(res.data);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al registrar el arqueo',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <main className="min-h-screen" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded-full" style={{ background: 'var(--c-accion)' }} />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--c-primario)' }}>
                Arqueos de Caja
              </h1>
            </div>
            <p className="text-sm ml-4" style={{ color: 'var(--c-texto-sub)' }}>
              Registra y consulta los arqueos de cada sede
            </p>
          </div>

          {/* Formulario de nuevo arqueo */}
          <div className="card-secundario p-6 sm:p-8 mb-8 animate-fadeIn">
            <h2 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--c-primario)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5l3 4.5m0 0l3-4.5M12 12v5.25M15 12H9m6 3H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nuevo Arqueo
            </h2>

            {mensaje.texto && (
              <div className={`${mensaje.tipo === 'exito' ? 'alerta-exito' : 'alerta-error'} px-4 py-3 rounded-xl mb-5 text-sm animate-fadeIn`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sede */}
              <div>
                <label htmlFor="id_sede_arqueo" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                  Sede *
                </label>
                <select
                  id="id_sede_arqueo"
                  value={formData.id_sede}
                  onChange={(e) => setFormData((p) => ({ ...p, id_sede: e.target.value }))}
                  required
                  className="input-field"
                >
                  <option value="">— Seleccionar —</option>
                  {sedes.map((s) => (
                    <option key={s._id} value={s._id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Saldo físico */}
              <div>
                <label htmlFor="saldo_fisico" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                  Saldo Físico (S/) *
                </label>
                <div className="relative">
                  <span
                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold pointer-events-none"
                    style={{ color: 'var(--c-texto-sub)' }}
                  >
                    S/
                  </span>
                  <input
                    id="saldo_fisico"
                    type="number"
                    value={formData.saldo_fisico}
                    onChange={(e) => setFormData((p) => ({ ...p, saldo_fisico: e.target.value }))}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="input-field pl-9 font-mono"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label htmlFor="obs_arqueo" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                  Observaciones <span style={{ color: 'var(--c-texto-sub)' }}>(opcional)</span>
                </label>
                <input
                  id="obs_arqueo"
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) => setFormData((p) => ({ ...p, observaciones: e.target.value }))}
                  placeholder="Notas del arqueo..."
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  id="btn-registrar-arqueo"
                  disabled={cargando}
                  className="btn-primario w-full py-3"
                >
                  {cargando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando arqueo...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Registrar Arqueo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de arqueos */}
          <div className="animate-fadeIn">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-primario)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Historial de Arqueos
            </h2>
            <div className="table-wrapper">
              {cargandoData ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--c-borde)', borderTopColor: 'var(--c-accion)' }} />
                  <p className="text-sm" style={{ color: 'var(--c-texto-sub)' }}>Cargando arqueos...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Fecha</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Sede</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Sistema</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Físico</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Diferencia</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arqueos.length > 0 ? (
                        arqueos.map((a) => {
                          const dif = a.diferencia || 0;
                          const difColor = dif === 0 ? 'var(--c-entrada)' : dif > 0 ? '#F59E0B' : 'var(--c-salida)';
                          return (
                            <tr key={a._id} className="table-row">
                              <td className="py-3 px-4 text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                                {new Date(a.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="py-3 px-4 font-medium text-xs" style={{ color: 'var(--c-texto)' }}>
                                {a.id_sede?.nombre || '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: 'var(--c-texto)' }}>
                                {formatSol(a.saldo_sistema)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: 'var(--c-texto)' }}>
                                {formatSol(a.saldo_fisico)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-xs" style={{ color: difColor }}>
                                {dif > 0 ? '+' : ''}{formatSol(dif)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`badge ${getEstadoClase(a.estado)}`}>{a.estado}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-sm" style={{ color: 'var(--c-texto-sub)' }}>
                            No hay arqueos registrados aún
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default Arqueos;
