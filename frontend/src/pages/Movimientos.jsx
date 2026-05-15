import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

const formatSol = (n) =>
  `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

const Movimientos = () => {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const cajaIdParam = searchParams.get('caja');
  const TOKEN_RUC = import.meta.env.VITE_API_RUC_TOKEN;

  const [cajas, setCajas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [cargandoData, setCargandoData] = useState(true);
  const [consultandoRuc, setConsultandoRuc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cajaFilter, setCajaFilter] = useState('');

  // Estados para Edición
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id_caja: cajaIdParam || '',
    tipo: false,
    concepto: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    tipo_comprobante: 'SIN_COMPROBANTE',
    numero_comprobante: '',
    ruc: '',
    razon_social: '',
    entidad_comprobante: '',
    observaciones: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const cargarDatos = async () => {
    try {
      const cajasUrl =
        usuario.rol === 'ADMINISTRADOR'
          ? '/cajas'
          : `/cajas/sede/${usuario.id_sede?._id || usuario.id_sede}`;
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
    const interval = setInterval(cargarDatos, 10000); // Polling cada 10s
    return () => clearInterval(interval);
  }, [usuario]);

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'tipo') {
      setFormData((p) => ({ ...p, tipo: value === '1' }));
      return;
    }
    // RUC: solo números, máx 11 dígitos + consulta automática SUNAT
    if (name === 'ruc') {
      const soloNum = value.replace(/\D/g, '').slice(0, 11);
      setFormData((p) => ({ ...p, ruc: soloNum, razon_social: '' }));

      if (/^\d{11}$/.test(soloNum)) {
        try {
          setConsultandoRuc(true);
          const response = await fetch(
            `https://dniruc.apisperu.com/api/v1/ruc/${soloNum}?token=${TOKEN_RUC}`
          );
          const data = await response.json();
          setFormData((p) => ({
            ...p,
            ruc: soloNum,
            razon_social: data.razonSocial || '',
          }));
        } catch (error) {
          console.error(error);
          toast.error('Error consultando el RUC en SUNAT');
        } finally {
          setConsultandoRuc(false);
        }
      }
      return;
    }
    // Nº correlativo Factura: forzar mayúsculas
    if (name === 'numero_comprobante') {
      const val = formData.tipo_comprobante === 'FACTURA' ? value.toUpperCase() : value.replace(/\D/g, '');
      setFormData((p) => ({ ...p, numero_comprobante: val }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  // Validaciones en tiempo real
  const regexFactura = /^F[A-Z0-9]{3}-\d{1,8}$/;   // F001-000001
  const regexRecibo = /^\d+$/;                     // Solo números
  const regexRUC = /^(10|15|17|20)\d{9}$/;

  const numComprobanteValido =
    formData.tipo_comprobante === 'FACTURA' ? regexFactura.test(formData.numero_comprobante) :
      formData.tipo_comprobante === 'RECIBO' ? regexRecibo.test(formData.numero_comprobante) : true;

  const rucValido = formData.tipo_comprobante === 'FACTURA'
    ? regexRUC.test(formData.ruc)
    : true;  // Recibo no requiere RUC

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmarRegistro = async () => {
    setCargandoForm(true);
    setShowConfirmModal(false);
    try {
      const [year, month, day] = formData.fecha.split('-').map(Number);
      const fechaParaBackend = new Date(year, month - 1, day, 12, 0, 0);

      const payload = {
        id_caja: formData.id_caja,
        id_usuario: usuario._id,
        tipo: formData.tipo,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto),
        fecha_hora: fechaParaBackend.toISOString(),
        tipo_comprobante: formData.tipo_comprobante,
        numero_comprobante: formData.numero_comprobante || null,
        entidad_comprobante: formData.tipo_comprobante === 'RECIBO' ? formData.entidad_comprobante : null,
        ruc: formData.tipo_comprobante === 'FACTURA' ? formData.ruc : null,
        razon_social: formData.tipo_comprobante === 'FACTURA' ? formData.razon_social : null,
        observaciones: formData.observaciones,
      };

      const { data } = await API.post('/movimientos', payload);

      toast.success(`Movimiento registrado exitosamente. Saldo resultante: ${formatSol(data.movimiento.saldo_resultante)}`);

      setFormData({
        id_caja: formData.id_caja, 
        tipo: false,
        concepto: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_comprobante: 'SIN_COMPROBANTE',
        numero_comprobante: '',
        ruc: '',
        razon_social: '',
        entidad_comprobante: '',
        observaciones: '',
      });

      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al registrar el movimiento');
    } finally {
      setCargandoForm(false);
    }
  };

  const handleEdit = (mov) => {
    setEditMode(true);
    setEditingId(mov._id);
    setFormData({
      id_caja: mov.id_caja?._id || mov.id_caja,
      tipo: mov.tipo,
      concepto: mov.concepto,
      monto: mov.monto,
      fecha: new Date(mov.fecha_hora).toISOString().split('T')[0],
      tipo_comprobante: mov.tipo_comprobante || 'SIN_COMPROBANTE',
      numero_comprobante: mov.numero_comprobante || '',
      ruc: mov.ruc || '',
      razon_social: mov.razon_social || '',
      entidad_comprobante: mov.entidad_comprobante || '',
      observaciones: mov.observaciones || '',
    });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditMode(false);
    setEditingId(null);
    setFormData({
      id_caja: cajaIdParam || '',
      tipo: false,
      concepto: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      tipo_comprobante: 'SIN_COMPROBANTE',
      numero_comprobante: '',
      ruc: '',
      razon_social: '',
      entidad_comprobante: '',
      observaciones: '',
    });
  };

  const confirmarEdicion = async () => {
    setCargandoForm(true);
    setShowConfirmModal(false);
    try {
      const [year, month, day] = formData.fecha.split('-').map(Number);
      const fechaParaBackend = new Date(year, month - 1, day, 12, 0, 0);

      const payload = {
        fecha_hora: fechaParaBackend.toISOString(),
        concepto: formData.concepto,
        monto: Number(formData.monto),
        tipo_comprobante: formData.tipo_comprobante,
        numero_comprobante: formData.numero_comprobante || null,
        entidad_comprobante: formData.tipo_comprobante === 'RECIBO' ? formData.entidad_comprobante : null,
        ruc: formData.tipo_comprobante === 'FACTURA' ? formData.ruc : null,
        razon_social: formData.tipo_comprobante === 'FACTURA' ? formData.razon_social : null,
        observaciones: formData.observaciones,
      };

      await API.put(`/movimientos/${editingId}`, payload);
      toast.success('Movimiento actualizado exitosamente');
      cancelarEdicion();
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al actualizar el movimiento');
    } finally {
      setCargandoForm(false);
    }
  };



  const cajaSeleccionada = cajas.find((c) => c._id === formData.id_caja);
  const esInferior = cajaSeleccionada && cajaSeleccionada.saldo_actual < cajaSeleccionada.saldo_minimo;
  const montoDiferencia = esInferior ? cajaSeleccionada.saldo_minimo - cajaSeleccionada.saldo_actual : 0;

  const saldoPct = cajaSeleccionada && cajaSeleccionada.saldo_maximo > 0
    ? Math.min(100, Math.round((cajaSeleccionada.saldo_actual / cajaSeleccionada.saldo_maximo) * 100))
    : 0;

  const saldoPctColor = esInferior ? 'var(--c-salida)' : saldoPct < 50 ? '#F59E0B' : 'var(--c-entrada)';

  return (
    <div className="min-h-screen bg-fondo animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Modal de Confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--c-fondo-card)] w-full max-w-md rounded-[24px] shadow-2xl border border-[var(--c-borde)] overflow-hidden animate-slide-up">
              <div className="p-8 text-center">
                <h3 className="text-xl font-black text-[var(--c-primario)] mb-2 uppercase tracking-tight">
                  {editMode ? '¿Confirmar Edición?' : '¿Confirmar Movimiento?'}
                </h3>
                
                {editMode ? (
                  <div className="bg-[var(--c-accion-pastel)] border border-[var(--c-accion)]/20 rounded-xl p-3 mb-6 flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--c-accion)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] text-[var(--c-accion)] font-bold leading-tight text-left uppercase">
                      Atención: Al cambiar el monto, se recalcularán automáticamente todos los saldos posteriores.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--c-texto-sub)] font-medium mb-8 uppercase tracking-widest">Verifica los datos antes de proceder</p>
                )}
                
                <div className="bg-[var(--c-secundario)] rounded-2xl p-6 space-y-4 mb-8 text-left border border-[var(--c-borde)]">
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--c-borde)]/60">
                    <span className="text-[10px] font-black text-[var(--c-texto-sub)] uppercase">Fecha de Registro</span>
                    <span className="text-xs font-black text-[var(--c-primario)]">
                      {(() => {
                        const [year, month, day] = formData.fecha.split('-').map(Number);
                        return new Date(year, month - 1, day).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--c-borde)]/60">
                    <span className="text-[10px] font-black text-[var(--c-texto-sub)] uppercase">Caja / Cuenta</span>
                    <span className="text-xs font-black text-[var(--c-primario)]">{cajaSeleccionada?.nombre_caja}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--c-borde)]/60">
                    <span className="text-[10px] font-black text-[var(--c-texto-sub)] uppercase">Operación</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${formData.tipo ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {formData.tipo ? 'EGRESO' : 'INGRESO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[var(--c-texto-sub)] uppercase">Monto Total</span>
                    <span className={`text-lg font-black ${formData.tipo ? 'text-[var(--c-salida)]' : 'text-[var(--c-entrada)]'}`}>{formatSol(formData.monto)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest border border-[var(--c-borde)] text-[var(--c-texto-sub)] hover:bg-[var(--c-secundario)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editMode ? confirmarEdicion : confirmarRegistro}
                    className="py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--c-accion)] text-white shadow-lg shadow-[var(--c-accion)]/20 hover:bg-[var(--c-accion-hover)] transition-all"
                  >
                    {editMode ? 'Confirmar Cambios' : 'Sí, Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-fadeIn">
          <div className="space-y-1">
            <h1 className="text-4xl font-heading font-black text-[var(--c-primario)]">Gestión de Movimientos</h1>
            <p className="text-[var(--c-texto-sub)] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--c-accion)] rounded-full"></span>
              Operaciones de Caja y Registro de Transacciones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Form Card */}
          <div className="lg:col-span-2">
            <div className="premium-card animate-slide-up">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--c-accion)] mb-8 flex items-center gap-3">
                <span className={`p-2 rounded-xl ${editMode ? 'bg-[var(--c-accion-pastel)] text-[var(--c-accion)]' : 'bg-[var(--c-accion)]/10 text-[var(--c-accion)]'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={editMode ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                  </svg>
                </span>
                {editMode ? 'Editando Movimiento' : 'Nuevo Registro de Operación'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[var(--c-primario)] uppercase tracking-widest ml-1">Fecha de Registro</label>
                    <input
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      required
                      min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`}
                      max={new Date().toISOString().split('T')[0]}
                      className="premium-input !bg-[var(--c-fondo-card)] !text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[var(--c-primario)] uppercase tracking-widest ml-1">Caja Origen/Destino</label>
                    <select
                      name="id_caja"
                      value={formData.id_caja}
                      onChange={handleChange}
                      required
                      disabled={editMode}
                      className={`premium-input !bg-[var(--c-fondo-card)] !text-xs !h-[42px] ${editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Seleccionar Cuenta...</option>
                      {cajas.map(c => (
                        <option key={c._id} value={c._id}>{c.codigo} — {c.nombre_caja}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[var(--c-primario)] uppercase tracking-widest ml-1">Tipo de Operación</label>
                    <div className={`flex bg-[var(--c-secundario)] p-1 rounded-xl border border-[var(--c-borde)] h-[42px] ${editMode ? 'opacity-50 pointer-events-none' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, tipo: false }))}
                        className={`flex-1 text-[10px] font-black rounded-lg transition-all ${!formData.tipo ? 'bg-white shadow-sm text-[var(--c-entrada)]' : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)]'}`}
                      >
                        INGRESO
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, tipo: true }))}
                        className={`flex-1 text-[10px] font-black rounded-lg transition-all ${formData.tipo ? 'bg-white shadow-sm text-[var(--c-salida)]' : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)]'}`}
                      >
                        EGRESO
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">Concepto o Detalle</label>
                    <input
                      type="text"
                      name="concepto"
                      value={formData.concepto}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Pago de servicios básicos del mes..."
                      className="premium-input !bg-[var(--c-fondo-card)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">Importe (S/)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--c-texto-sub)]">S/</span>
                      <input
                        type="number"
                        name="monto"
                        value={formData.monto}
                        onChange={handleChange}
                        required
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        className={`premium-input !pl-10 !bg-[var(--c-fondo-card)] text-xl font-black ${formData.tipo ? 'text-[var(--c-salida)]' : 'text-[var(--c-entrada)]'}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-6 bg-[var(--c-accion-pastel)] rounded-2xl border border-[var(--c-accion)]/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">Documentación de Respaldo</label>
                    <span className="text-[10px] font-bold text-[var(--c-accion)] bg-white px-2 py-0.5 rounded-md border border-[var(--c-accion)]/10">Requerido</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'SIN_COMPROBANTE', label: 'Sin Sustento', desc: 'Interno' },
                      { id: 'RECIBO', label: 'Recibo', desc: 'Simple' },
                      { id: 'FACTURA', label: 'Factura', desc: 'Con RUC' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, tipo_comprobante: type.id }))}
                        className={`flex flex-col items-center p-3 rounded-xl border transition-all ${formData.tipo_comprobante === type.id
                          ? 'bg-[var(--c-fondo-card)] border-[var(--c-accion)] shadow-sm'
                          : 'bg-transparent border-transparent text-[var(--c-texto-sub)] hover:bg-[var(--c-fondo-card)]/40'
                          }`}
                      >
                        <span className={`text-xs font-bold ${formData.tipo_comprobante === type.id ? 'text-[var(--c-accion)]' : ''}`}>{type.label}</span>
                        <span className="text-[9px] opacity-60 uppercase font-bold tracking-tighter">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {(formData.tipo_comprobante === 'RECIBO' || formData.tipo_comprobante === 'FACTURA') && (
                  <div className="p-6 bg-[var(--c-secundario)] rounded-2xl animate-slideIn space-y-6 border border-[var(--c-borde)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-[var(--c-accion)] rounded-full"></div>
                        <h4 className="text-sm font-bold text-[var(--c-primario)] uppercase tracking-wider">Detalles del Comprobante</h4>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          background: formData.tipo_comprobante === 'FACTURA' ? '#EEF2FF' : '#F0FDF4',
                          color: formData.tipo_comprobante === 'FACTURA' ? '#3B59DA' : '#16A34A',
                          border: `1px solid ${formData.tipo_comprobante === 'FACTURA' ? '#3B59DA20' : '#16A34A20'}`
                        }}
                      >
                        {formData.tipo_comprobante === 'FACTURA' ? 'Serie F — SUNAT' : 'Solo Números'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Nº Correlativo */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">
                          Nº Correlativo
                        </label>
                        <input
                          type="text"
                          name="numero_comprobante"
                          value={formData.numero_comprobante}
                          onChange={handleChange}
                          required
                          placeholder={formData.tipo_comprobante === 'FACTURA' ? 'F001-000001' : '000123'}
                          maxLength={formData.tipo_comprobante === 'FACTURA' ? 13 : 20}
                          className={`premium-input !bg-[var(--c-fondo-card)] font-mono ${formData.numero_comprobante && !numComprobanteValido
                            ? '!border-red-400 !focus:border-red-500'
                            : formData.numero_comprobante && numComprobanteValido
                              ? '!border-green-400 !focus:border-green-500'
                              : ''
                            }`}
                        />
                      </div>

                      {/* Campo extra para Recibo */}
                      {formData.tipo_comprobante === 'RECIBO' && (
                        <div className="space-y-2 animate-fadeIn">
                          <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">
                            {formData.tipo ? 'Entregado a' : 'Recibido de'}
                          </label>
                          <input
                            type="text"
                            name="entidad_comprobante"
                            value={formData.entidad_comprobante}
                            onChange={handleChange}
                            required
                            placeholder="Ej: JUAN JARAMILLO GUILLEN"
                            className="premium-input !bg-[var(--c-fondo-card)]"
                          />
                        </div>
                      )}

                      {/* RUC + Razón Social — SOLO para Factura */}
                      {formData.tipo_comprobante === 'FACTURA' && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">
                              RUC Emisor <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              name="ruc"
                              value={formData.ruc}
                              onChange={handleChange}
                              required
                              placeholder="20601597056"
                              maxLength={11}
                              inputMode="numeric"
                              className={`premium-input !bg-[var(--c-fondo-card)] font-mono ${formData.ruc && !rucValido
                                ? '!border-red-400 !focus:border-red-500'
                                : formData.ruc && rucValido
                                  ? '!border-green-400 !focus:border-green-500'
                                  : ''
                                }`}
                            />
                          </div>

                          <div className="space-y-2 col-span-2">
                            <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">
                              Razón Social
                            </label>
                            <input
                              type="text"
                              name="razon_social"
                              value={formData.razon_social}
                              readOnly
                              required
                              placeholder={consultandoRuc ? 'Consultando SUNAT...' : 'CORPORACIÓN INTEROCEÁNICA JJJA S.R.L.'}
                              className="premium-input !bg-[var(--c-fondo-card)] opacity-80"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Notas y Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    rows={2}
                    className="premium-input resize-none !bg-[var(--c-fondo-card)]"
                    placeholder="Información adicional relevante para la auditoría..."
                  />
                </div>

                <div className={`pt-6 ${editMode ? 'grid grid-cols-2 gap-4' : ''}`}>
                  {editMode && (
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="w-full py-4 rounded-xl text-xs font-bold uppercase border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={cargandoForm}
                    className={`btn-gold !w-full !py-4 !text-sm shadow-xl ${editMode ? '!bg-[var(--c-accion)] !border-[var(--c-accion)]' : ''}`}
                  >
                    {cargandoForm ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : editMode ? 'Actualizar Registro' : 'Finalizar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Info Caja */}
          <div className="space-y-6">
            {cajaSeleccionada ? (
              <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm sticky top-24 overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--c-accion-pastel)] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-accion)] mb-1 block">Estado Actual</span>
                    <h3 className="text-2xl font-heading font-bold text-[var(--c-primario)] leading-tight">{cajaSeleccionada.nombre_caja}</h3>
                    <p className="font-mono text-[10px] text-[var(--c-texto-sub)] mt-1 font-bold bg-[var(--c-secundario)] px-2 py-0.5 rounded-md w-fit">{cajaSeleccionada.codigo}</p>
                  </div>
                  <div className="p-3 bg-[var(--c-fondo-card)] rounded-2xl shadow-sm border border-[var(--c-borde)]" style={{ color: cajaSeleccionada.color_primario }}>
                    {cajaSeleccionada.nombre_caja.toLowerCase().includes('efectivo') ? (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                </div>

                <div
                  className="relative z-10 text-center py-10 px-4 rounded-3xl mb-8 border border-[var(--c-borde)] shadow-inner"
                  style={{ backgroundColor: `${cajaSeleccionada.color_primario}10` }}
                >
                  <p className="text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-widest mb-2">Fondos Disponibles</p>
                  <p className="text-4xl font-black font-heading tracking-tight" style={{ color: cajaSeleccionada.color_primario }}>
                    {formatSol(cajaSeleccionada.saldo_actual)}
                  </p>
                </div>

                {esInferior && (
                  <div className="relative z-10 p-4 bg-[var(--c-danger-pastel)] border border-red-100 rounded-2xl mb-8 flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <p className="text-[11px] text-red-800 font-bold leading-tight">
                      Crítico: Saldo inferior al mínimo tolerable. Requiere reposición de {formatSol(montoDiferencia)}.
                    </p>
                  </div>
                )}

                <div className="relative z-10 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-[var(--c-texto-sub)]">Nivel de Liquidez</span>
                      <span style={{ color: cajaSeleccionada.color_primario }}>{saldoPct}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[var(--c-secundario)] rounded-full overflow-hidden border border-[var(--c-borde)]">
                      <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{ width: `${saldoPct}%`, backgroundColor: cajaSeleccionada.color_primario }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--c-borde)]">
                    <div className="space-y-1">
                      <p className="text-[9px] text-[var(--c-texto-sub)] uppercase font-bold tracking-widest text-center">Límite Min.</p>
                      <p className="text-sm font-black text-center text-[var(--c-primario)] opacity-80">{formatSol(cajaSeleccionada.saldo_minimo)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-[var(--c-texto-sub)] uppercase font-bold tracking-widest text-center">Límite Máx.</p>
                      <p className="text-sm font-black text-center text-[var(--c-primario)] opacity-80">{formatSol(cajaSeleccionada.saldo_maximo)}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--c-borde)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--c-accion-pastel)] text-[var(--c-accion)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--c-primario)] uppercase tracking-wider">Operación Segura</p>
                        <p className="text-[10px] text-[var(--c-texto-sub)] font-medium leading-tight">Auditoría en tiempo real activa para esta caja.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--c-secundario)] border-2 border-dashed border-[var(--c-borde)] rounded-[24px] flex flex-col items-center justify-center py-20 text-center opacity-60">
                <div className="w-20 h-20 bg-[var(--c-fondo-card)] rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-[var(--c-accion)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-[var(--c-primario)] font-bold mb-1">Sin Selección</h4>
                <p className="text-xs text-[var(--c-texto-sub)] px-10 leading-relaxed font-medium">Por favor, elija una caja en el formulario para visualizar los indicadores de saldo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Historico Table */}
        <div className="mt-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[var(--c-accion)] rounded-full" />
              <h2 className="text-2xl font-heading font-bold text-[var(--c-primario)]">Auditoría de Movimientos</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <select
                className="premium-input !py-2.5 !text-xs !w-48 !bg-[var(--c-fondo-card)] shadow-sm font-bold text-[var(--c-primario)]"
                value={cajaFilter}
                onChange={(e) => setCajaFilter(e.target.value)}
              >
                <option value="">Todas las Cuentas</option>
                {cajas.map(c => <option key={c._id} value={c._id}>{c.nombre_caja}</option>)}
              </select>

              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-texto-sub)] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Buscar por concepto..."
                  className="premium-input !py-2.5 !pl-11 !text-xs !w-64 !bg-[var(--c-fondo-card)] shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Fecha / Hora ↑</th>
                  <th>Caja</th>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th className="text-right">Monto</th>
                  <th className="text-right">Saldo Resultante</th>
                  <th>Comprobante</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.filter(m => {
                  const matchSearch = m.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.id_caja?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchCaja = cajaFilter ? m.id_caja?._id === cajaFilter : true;
                  return matchSearch && matchCaja;
                }).slice(0, 20).reverse().map(mov => {
                  const cajaData = cajas.find(c => c._id === (mov.id_caja?._id || mov.id_caja));
                  const colorCaja = cajaData?.color_primario || mov.id_caja?.color_primario || '#3B59DA';

                  return (
                    <tr key={mov._id}>
                      <td className="text-[10px] font-bold opacity-60 uppercase">
                        {new Date(mov.fecha_hora).toLocaleDateString('es-PE', { dateStyle: 'medium' })}
                      </td>
                      <td>
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border shadow-sm"
                          style={{
                            color: colorCaja,
                            backgroundColor: `${colorCaja}12`,
                            borderColor: `${colorCaja}30`
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorCaja }}></div>
                          {mov.id_caja?.nombre_caja || mov.id_caja?.codigo}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${!mov.tipo ? 'bg-[var(--c-success-pastel)] text-green-700' : 'bg-[var(--c-danger-pastel)] text-red-700'}`}>
                          {!mov.tipo ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="text-xs font-medium max-w-[250px] truncate" title={mov.concepto}>{mov.concepto}</td>
                      <td className={`font-black text-xs ${mov.tipo ? 'text-[var(--c-salida)]' : 'text-[var(--c-entrada)]'}`}>
                        {mov.tipo ? '-' : '+'}{formatSol(mov.monto)}
                      </td>
                      <td className="text-right text-[11px] font-black opacity-60">{formatSol(mov.saldo_resultante)}</td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-black text-[var(--c-primario)] opacity-50">{mov.tipo_comprobante || 'S/C'}</span>
                          <span className="text-[10px] font-mono font-bold text-[var(--c-accion)]">{mov.numero_comprobante || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleEdit(mov)}
                            className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors group"
                            title="Editar registro"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movimientos;
