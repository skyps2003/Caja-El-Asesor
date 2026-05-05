import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const formatSol = (n) =>
  `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

const Movimientos = () => {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const cajaIdParam = searchParams.get('caja');

  const [cajas, setCajas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [cargandoData, setCargandoData] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id_caja: cajaIdParam || '',
    tipo: false,
    concepto: '',
    monto: '',
    tiene_recibo: true,
    nro_recibo: '',
    motivo_sin_recibo: '',
    observaciones: '',
  });

  const cargarDatos = async () => {
    try {
      const cajasUrl =
        usuario.rol === 'ADMINISTRADOR'
          ? '/cajas'
          : `/cajas/sede/${usuario.id_sede._id || usuario.id_sede}`;
      const [cajasRes, movRes] = await Promise.all([
        API.get(cajasUrl),
        API.get('/movimientos'),
      ]);
      setCajas(cajasRes.data);
      setMovimientos(movRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoData(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 5000); // Polling cada 5s
    return () => clearInterval(interval);
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'tiene_recibo') {
      setFormData((p) => ({
        ...p,
        tiene_recibo: checked,
        nro_recibo: checked ? p.nro_recibo : '',
        motivo_sin_recibo: checked ? '' : p.motivo_sin_recibo,
      }));
      return;
    }
    if (name === 'tipo') {
      setFormData((p) => ({ ...p, tipo: value === '1' }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setCargandoForm(true);
    try {
      const payload = {
        id_caja: formData.id_caja,
        id_usuario: usuario._id,
        tipo: formData.tipo,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto),
        tiene_recibo: formData.tiene_recibo,
        nro_recibo: formData.tiene_recibo ? formData.nro_recibo : null,
        motivo_sin_recibo: !formData.tiene_recibo ? formData.motivo_sin_recibo : null,
        observaciones: formData.observaciones,
      };
      const { data } = await API.post('/movimientos', payload);
      setMensaje({
        tipo: 'exito',
        texto: `Movimiento registrado exitosamente. Saldo resultante: ${formatSol(data.movimiento.saldo_resultante)}`,
      });
      setFormData({
        id_caja: cajaIdParam || '',
        tipo: false,
        concepto: '',
        monto: '',
        tiene_recibo: true,
        nro_recibo: '',
        motivo_sin_recibo: '',
        observaciones: '',
      });
      const res = await API.get('/movimientos');
      setMovimientos(res.data);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || 'Error al registrar el movimiento',
      });
    } finally {
      setCargandoForm(false);
    }
  };

  const cajaSeleccionada = cajas.find((c) => c._id === formData.id_caja);
  const saldoPct = cajaSeleccionada && cajaSeleccionada.saldo_maximo > 0
    ? Math.min(100, Math.round((cajaSeleccionada.saldo_actual / cajaSeleccionada.saldo_maximo) * 100))
    : 0;
  const saldoPctColor = saldoPct < 20 ? 'var(--c-salida)' : saldoPct < 50 ? '#F59E0B' : 'var(--c-entrada)';

  return (
    <>
      <main className="min-h-screen" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded-full" style={{ background: 'var(--c-accion)' }} />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--c-primario)' }}>
                Registrar Movimiento
              </h1>
            </div>
            <p className="text-sm ml-4" style={{ color: 'var(--c-texto-sub)' }}>
              Registra entradas y salidas de efectivo en las cajas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Formulario */}
            <div className="lg:col-span-2 animate-slideLeft">
              <div className="card-secundario p-6 sm:p-8">
                <h2 className="text-base font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--c-primario)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nuevo Movimiento
                </h2>

                {mensaje.texto && (
                  <div className={`${mensaje.tipo === 'exito' ? 'alerta-exito' : 'alerta-error'} px-4 py-3 rounded-xl mb-5 text-sm animate-fadeIn`}>
                    {mensaje.texto}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Caja + Tipo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="id_caja" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                        Caja *
                      </label>
                      <select
                        id="id_caja"
                        name="id_caja"
                        value={formData.id_caja}
                        onChange={handleChange}
                        required
                        className="input-field"
                      >
                        <option value=""> Seleccionar caja </option>
                        {cajas.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.codigo} - {c.nombre_caja}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tipo" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                        Tipo de Movimiento *
                      </label>
                      <select
                        id="tipo"
                        name="tipo"
                        value={formData.tipo ? '1' : '0'}
                        onChange={handleChange}
                        required
                        className="input-field"
                      >
                        <option value="0">Entrada (Ingreso)</option>
                        <option value="1">Salida (Egreso)</option>
                      </select>
                    </div>
                  </div>

                  {/* Concepto */}
                  <div>
                    <label htmlFor="concepto" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                      Concepto *
                    </label>
                    <input
                      id="concepto"
                      type="text"
                      name="concepto"
                      value={formData.concepto}
                      onChange={handleChange}
                      required
                      placeholder="Descripción del movimiento"
                      className="input-field"
                    />
                  </div>

                  {/* Monto */}
                  <div>
                    <label htmlFor="monto" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                      Monto (S/) *
                    </label>
                    <div className="relative">
                      <span
                        className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold pointer-events-none"
                        style={{ color: 'var(--c-texto-sub)' }}
                      >

                      </span>
                      <input
                        id="monto"
                        type="number"
                        name="monto"
                        value={formData.monto}
                        onChange={handleChange}
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        className="input-field pl-9 font-mono text-lg font-semibold"
                        style={{ color: formData.tipo ? 'var(--c-salida)' : 'var(--c-entrada)' }}
                      />
                    </div>
                  </div>

                  {/* Panel de recibo */}
                  <div className="recibo-panel">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center">
                        <input
                          id="tiene_recibo"
                          type="checkbox"
                          name="tiene_recibo"
                          checked={formData.tiene_recibo}
                          onChange={handleChange}
                          className="w-4.5 h-4.5 rounded cursor-pointer"
                          style={{ accentColor: 'var(--c-accion)' }}
                        />
                      </div>
                      <label
                        htmlFor="tiene_recibo"
                        className="text-sm font-semibold cursor-pointer select-none"
                        style={{ color: 'var(--c-texto)' }}
                      >
                        Tiene comprobante / recibo
                      </label>
                    </div>

                    <div className="mt-4">
                      {formData.tiene_recibo ? (
                        <div className="animate-fadeIn">
                          <label
                            htmlFor="nro_recibo"
                            className="block text-sm font-medium mb-1.5"
                            style={{ color: 'var(--c-texto)' }}
                          >
                            Número de Recibo <span style={{ color: 'var(--c-salida)' }}>*</span>
                          </label>
                          <input
                            id="nro_recibo"
                            type="text"
                            name="nro_recibo"
                            value={formData.nro_recibo}
                            onChange={handleChange}
                            placeholder="Ej: R-00123"
                            className="input-field"
                            required /* <--- AQUÍ HACEMOS QUE SEA OBLIGATORIO */
                          />
                        </div>
                      ) : (
                        <div className="animate-fadeIn">
                          <label
                            htmlFor="motivo_sin_recibo"
                            className="block text-sm font-semibold mb-1.5"
                            style={{ color: 'var(--c-salida)' }}
                          >
                            Motivo por el cual NO tiene recibo *
                          </label>
                          <textarea
                            id="motivo_sin_recibo"
                            name="motivo_sin_recibo"
                            value={formData.motivo_sin_recibo}
                            onChange={handleChange}
                            required
                            rows={3}
                            placeholder="Explique el motivo detalladamente..."
                            className="input-field resize-none"
                            style={{ borderColor: 'var(--c-salida)', background: 'rgba(220,38,38,0.04)' }}
                          />
                          <div
                            className="flex items-center gap-1.5 mt-2 text-xs font-medium px-3 py-2 rounded-lg"
                            style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--c-salida)' }}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            Este movimiento quedará en estado <strong>PENDIENTE_SUSTENTO</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label htmlFor="observaciones" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--c-texto)' }}>
                      Observaciones <span style={{ color: 'var(--c-texto-sub)' }}>(opcional)</span>
                    </label>
                    <textarea
                      id="observaciones"
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Notas adicionales..."
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    id="btn-registrar-movimiento"
                    disabled={cargandoForm}
                    className="btn-primario w-full py-3.5 text-base"
                  >
                    {cargandoForm ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Registrar Movimiento
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Panel lateral - Info caja */}
            <div className="animate-slideRight">
              {cajaSeleccionada ? (
                <div className="card p-6 sticky top-24">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-5 pb-3 border-b" style={{ color: 'var(--c-texto-sub)', borderColor: 'var(--c-borde)' }}>
                    Información de Caja
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--c-texto-sub)' }}>Código</p>
                        <p className="font-mono font-bold text-lg" style={{ color: 'var(--c-accion)' }}>{cajaSeleccionada.codigo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs mb-0.5" style={{ color: 'var(--c-texto-sub)' }}>Nombre</p>
                        <p className="font-semibold text-sm" style={{ color: 'var(--c-texto)' }}>{cajaSeleccionada.nombre_caja}</p>
                      </div>
                    </div>

                    <div className="py-4 px-5 rounded-xl text-center" style={{ background: 'var(--c-secundario)' }}>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--c-texto-sub)' }}>Saldo Actual</p>
                      <p className="text-3xl font-bold" style={{ color: saldoPctColor }}>
                        {formatSol(cajaSeleccionada.saldo_actual)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                        <span>Nivel de saldo</span>
                        <span className="font-semibold" style={{ color: saldoPctColor }}>{saldoPct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${saldoPct}%`, background: saldoPctColor, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(220,38,38,0.06)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--c-texto-sub)' }}>Mínimo</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--c-salida)' }}>
                          {formatSol(cajaSeleccionada.saldo_minimo)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(22,163,74,0.06)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--c-texto-sub)' }}>Máximo</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--c-entrada)' }}>
                          {formatSol(cajaSeleccionada.saldo_maximo)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--c-secundario)' }}>
                    <svg className="w-6 h-6" style={{ color: 'var(--c-texto-sub)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--c-texto-sub)' }}>
                    Selecciona una caja para ver su información
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Historial de movimientos */}
          <div className="mt-10 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--c-primario)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
                Últimos Movimientos
              </h2>
              <input
                type="text"
                placeholder="Buscar por concepto o caja..."
                className="input-field !h-10 !w-64 !text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-wrapper">
              {cargandoData ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--c-borde)', borderTopColor: 'var(--c-accion)' }} />
                  <p className="text-sm" style={{ color: 'var(--c-texto-sub)' }}>Cargando movimientos...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Fecha</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Caja</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Tipo</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Concepto</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Monto</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Saldo</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Recibo</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wide opacity-80">Sustento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.filter(m => 
                        m.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        m.id_caja?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length > 0 ? (
                        movimientos.filter(m => 
                          m.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.id_caja?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).slice(0, 25).map((mov) => (
                          <tr key={mov._id} className="table-row">
                            <td className="py-3 px-4 text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                              {new Date(mov.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs font-bold" style={{ color: 'var(--c-accion)' }}>
                              {mov.id_caja?.codigo || '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`badge ${!mov.tipo ? 'badge-entrada' : 'badge-salida'}`}>
                                {!mov.tipo ? '▲ Entrada' : '▼ Salida'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs max-w-xs truncate" style={{ color: 'var(--c-texto)' }}>
                              {mov.concepto}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-xs">
                              <span style={{ color: !mov.tipo ? 'var(--c-entrada)' : 'var(--c-salida)' }}>
                                {!mov.tipo ? '+' : '−'} {formatSol(mov.monto)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-xs" style={{ color: 'var(--c-primario)' }}>
                              {formatSol(mov.saldo_resultante)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {mov.tiene_recibo ? (
                                <a
                                  href={mov.url_recibo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800 hover:underline font-medium font-mono text-xs transition-colors"
                                >
                                  {/* Muestra el número de recibo, o un texto alternativo si está vacío */}
                                  {mov.nro_recibo || 'Ver recibo'}
                                </a>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`badge ${mov.estado_sustento === 'APROBADO' ? 'badge-aprobado' : 'badge-pendiente'}`}>
                                {mov.estado_sustento === 'APROBADO' ? 'Aprobado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--c-texto-sub)' }}>
                            No hay movimientos registrados aún
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

export default Movimientos;
