import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

// Icons
const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
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
const EditIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);
const DeleteIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const MovimientoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);
const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const XIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AdminDashboard = () => {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'usuarios';
  const [tabActiva, setTabActiva] = useState(tabParam);
  
  useEffect(() => {
    setTabActiva(tabParam);
  }, [tabParam]);

  const cambiarTab = (nuevaTab) => {
    setTabActiva(nuevaTab);
    setSearchParams({ tab: nuevaTab });
  };
  
  const [sedes, setSedes] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMovimientos, setFiltroMovimientos] = useState('PENDIENTE'); // 'TODOS', 'PENDIENTE'
  const [cajaFilter, setCajaFilter] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [sedesRes, cajasRes, usuariosRes, movRes] = await Promise.all([
        API.get('/sedes'),
        API.get('/cajas'),
        API.get('/usuarios'),
        API.get('/movimientos')
      ]);
      setSedes(sedesRes.data);
      setCajas(cajasRes.data);
      setUsuarios(usuariosRes.data);
      setMovimientos(movRes.data);
    } catch (error) {
      console.error('Error al cargar datos', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'usuario', 'sede', 'caja'
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [formData, setFormData] = useState({});
  const [aplicarATodasSedes, setAplicarATodasSedes] = useState(false);
  
  // Modal State for Deletion
  const [modalEliminar, setModalEliminar] = useState({ isOpen: false, type: null, id: null });

  const handleOpenModal = (type, entity = null) => {
    setModalType(type);
    setIsEditing(!!entity);
    setCurrentEntity(entity);
    setAplicarATodasSedes(false);
    if (entity) {
      if (type === 'usuario') setFormData({ ...entity, password: '', id_sede: entity.id_sede._id });
      else if (type === 'caja') setFormData({ ...entity, id_sede: entity.id_sede._id });
      else setFormData({ ...entity });
    } else {
      if (type === 'usuario') setFormData({ nombre: '', login_usuario: '', password: '', rol: 'CAJERO_SEDE', id_sede: sedes[0]?._id || '' });
      else if (type === 'caja') setFormData({ codigo: '', nombre_caja: '', saldo_minimo: 0, saldo_maximo: 0, color_primario: '#16A34A', color_secundario: '#15803D', id_sede: sedes[0]?._id || '' });
      else if (type === 'sede') setFormData({ nombre: '', direccion: '', estado: true });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/${modalType}s/${currentEntity._id}` : `/${modalType}s`;
      const method = isEditing ? 'put' : 'post';
      
      const payload = { ...formData };
      if (modalType === 'caja' && !isEditing) {
        payload.id_sede = 'todas';
      }

      await API[method](url, payload);
      await cargarDatos();
      handleCloseModal();
      toast.success(isEditing ? 'Registro actualizado con éxito' : 'Registro creado con éxito');
    } catch (error) {
      console.error('Error al guardar', error);
      toast.error(error.response?.data?.mensaje || 'Error al guardar, verifique los datos');
    }
  };

  const handleAprobarMovimiento = async (id) => {
    try {
      await API.put(`/movimientos/${id}/estado`, { estado_comprobante: 'ASIGNADO', estado_sustento: 'APROBADO' });
      toast.success('Movimiento aprobado correctamente');
      await cargarDatos();
    } catch (error) {
      console.error('Error al aprobar movimiento', error);
      toast.error('Error al aprobar movimiento');
    }
  };

  const handleRechazarMovimiento = async (id) => {
    const motivo = window.prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      try {
        await API.put(`/movimientos/${id}/estado`, { estado_comprobante: 'RECHAZADO', motivo_rechazo: motivo });
        toast.success('Movimiento rechazado');
        await cargarDatos();
      } catch (error) {
        console.error('Error al rechazar movimiento', error);
        toast.error('Error al rechazar movimiento');
      }
    }
  };

  const confirmarEliminacion = async () => {
    if (!modalEliminar.isOpen) return;
    const { type, id } = modalEliminar;
    try {
      await API.delete(`/${type}s/${id}`);
      toast.success('Registro eliminado con éxito');
      await cargarDatos();
      setModalEliminar({ isOpen: false, type: null, id: null });
    } catch (error) {
      console.error('Error al eliminar', error);
      toast.error(error.response?.data?.mensaje || 'Error al eliminar');
      setModalEliminar({ isOpen: false, type: null, id: null });
    }
  };

  const handleDelete = (type, id) => {
    if (type === 'usuario') {
      const targetUser = usuarios.find(u => u._id === id);
      if (targetUser?.rol === 'ADMINISTRADOR') {
        toast.error('No se permite eliminar usuarios con el nivel de acceso ADMINISTRADOR.');
        return;
      }
    }
    setModalEliminar({ isOpen: true, type, id });
  };

  if (cargando) return <Loader mensaje="Cargando Administración..." />;

  return (
    <>
      <main className="min-h-screen p-8" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-fadeIn">
            <div className="space-y-1">
              <h1 className="text-4xl font-heading font-bold text-[var(--c-primario)]">Gestión Administrativa</h1>
              <p className="text-[var(--c-texto-sub)] font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--c-accion)] rounded-full"></span>
                Control de Infraestructura y Usuarios
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Segmented Control Style */}
          <div className="flex bg-[var(--c-secundario)] p-1.5 rounded-2xl border border-[var(--c-borde)] mb-10 w-fit backdrop-blur-md">
            {[
              { id: 'usuarios', icon: <UsersIcon />, label: 'Usuarios' },
              { id: 'sedes', icon: <SedeIcon />, label: 'Sedes' },
              { id: 'cajas', icon: <CajaIcon />, label: 'Cajas' },
              { id: 'movimientos', icon: <MovimientoIcon />, label: 'Aprobaciones' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => cambiarTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                  tabActiva === tab.id 
                    ? 'bg-[var(--c-fondo-card)] shadow-lg shadow-black/5 text-[var(--c-primario)] border border-[var(--c-borde)]' 
                    : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)] hover:bg-black/5'
                }`}
              >
                <span className={tabActiva === tab.id ? 'text-[var(--c-accion)]' : 'opacity-50'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm animate-slideLeft delay-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[var(--c-accion)] rounded-full"></div>
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--c-primario)]">
                  {tabActiva === 'usuarios' && 'Directorio de Personal'}
                  {tabActiva === 'sedes' && 'Infraestructura de Sedes'}
                  {tabActiva === 'cajas' && 'Configuración de Cajas'}
                  {tabActiva === 'movimientos' && 'Auditoría de Movimientos'}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                {tabActiva === 'movimientos' && (
                  <div className="flex bg-[var(--c-secundario)] p-1 rounded-xl border border-[var(--c-borde)]">
                    <button 
                      onClick={() => setFiltroMovimientos('PENDIENTE')}
                      className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filtroMovimientos === 'PENDIENTE' ? 'bg-[var(--c-fondo-card)] shadow-sm text-[var(--c-primario)]' : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)]'}`}
                    >PENDIENTES</button>
                    <button 
                      onClick={() => setFiltroMovimientos('TODOS')}
                      className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filtroMovimientos === 'TODOS' ? 'bg-[var(--c-fondo-card)] shadow-sm text-[var(--c-primario)]' : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)]'}`}
                    >TODOS</button>
                  </div>
                )}
                
                {tabActiva === 'movimientos' && (
                  <select 
                     className="premium-input !py-2.5 !text-xs !w-48 !bg-[var(--c-fondo-card)] shadow-sm font-bold text-[var(--c-primario)]"
                     value={cajaFilter}
                     onChange={(e) => setCajaFilter(e.target.value)}
                  >
                     <option value="">Todas las Cuentas</option>
                     {cajas.map(c => <option key={c._id} value={c._id}>{c.nombre_caja}</option>)}
                  </select>
                )}

                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-texto-sub)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Filtrar registros..."
                    className="premium-input !pl-10 !py-2.5 !text-xs !w-64 !bg-[var(--c-secundario)]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {tabActiva !== 'movimientos' && (
                  <button onClick={() => handleOpenModal(tabActiva.slice(0, -1))} className="btn-gold !py-2.5 !px-6 !text-xs shadow-xl">
                    <span className="text-lg mr-2 leading-none">+</span>
                    CREAR NUEVO
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <table className="premium-table">
                <thead>
                  <tr>
                    {tabActiva === 'usuarios' && (
                      <>
                        <th>Nombre del Usuario</th>
                        <th>Login ID</th>
                        <th>Rol</th>
                        <th>Sede Asignada</th>
                      </>
                    )}
                    {tabActiva === 'sedes' && (
                      <>
                        <th>Nombre Sede</th>
                        <th>Ubicación / Dirección</th>
                        <th>Estado Operativo</th>
                      </>
                    )}
                    {tabActiva === 'cajas' && (
                      <>
                        <th>Cód.</th>
                        <th>Denominación</th>
                        <th>Sede</th>
                        <th className="text-right">Límites (Min/Max)</th>
                      </>
                    )}
                    {tabActiva === 'movimientos' && (
                      <>
                        <th>Fecha / Hora</th>
                        <th>Caja</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th className="text-right">Saldo Final</th>
                        <th>Comprobante</th>
                        <th>Estado</th>
                      </>
                    )}
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                  <tbody>
                    {tabActiva === 'usuarios' && usuarios.filter(u => 
                      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      u.login_usuario.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(u => (
                      <tr key={u._id}>
                        <td className="font-bold text-[var(--c-primario)]">{u.nombre}</td>
                        <td className="text-[11px] font-mono opacity-70">{u.login_usuario}</td>
                        <td><span className="badge badge-warning">{u.rol}</span></td>
                        <td className="text-xs font-medium">{u.id_sede?.nombre}</td>
                        <td className="flex justify-center gap-3">
                          <button onClick={() => handleOpenModal('usuario', u)} className="p-2 rounded-xl bg-[var(--c-accion-pastel)] text-[var(--c-accion)] hover:scale-110 transition-all"><EditIcon /></button>
                          <button onClick={() => handleDelete('usuario', u._id)} className="p-2 rounded-xl bg-[var(--c-danger-pastel)] text-[var(--c-salida)] hover:scale-110 transition-all"><DeleteIcon /></button>
                        </td>
                      </tr>
                    ))}
                    {tabActiva === 'sedes' && sedes.filter(s => 
                      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      s.direccion.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(s => (
                      <tr key={s._id}>
                        <td className="font-bold text-[var(--c-primario)]">{s.nombre}</td>
                        <td className="text-xs opacity-70">{s.direccion}</td>
                        <td><span className={`badge ${s.estado ? 'badge-success' : 'badge-danger'}`}>{s.estado ? 'Activo' : 'Inactivo'}</span></td>
                        <td className="flex justify-center gap-3">
                          <button onClick={() => handleOpenModal('sede', s)} className="p-2 rounded-xl bg-[var(--c-accion-pastel)] text-[var(--c-accion)] hover:scale-110 transition-all"><EditIcon /></button>
                          <button onClick={() => handleDelete('sede', s._id)} className="p-2 rounded-xl bg-[var(--c-danger-pastel)] text-[var(--c-salida)] hover:scale-110 transition-all"><DeleteIcon /></button>
                        </td>
                      </tr>
                    ))}
                    {tabActiva === 'cajas' && cajas.filter(c => 
                      c.nombre_caja.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(c => (
                      <tr key={c._id}>
                        <td className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm" 
                            style={{ background: `linear-gradient(135deg, ${c.color_primario}, ${c.color_secundario})` }}
                          ></div>
                          <span className="font-black text-[var(--c-accion)] text-[10px] tracking-widest">{c.codigo}</span>
                        </td>
                        <td className="font-bold text-[var(--c-primario)]">{c.nombre_caja}</td>
                        <td className="text-xs font-medium">{c.id_sede?.nombre}</td>
                        <td className="text-right text-[11px] font-black opacity-60">S/ {c.saldo_minimo} - S/ {c.saldo_maximo}</td>
                        <td className="flex justify-center gap-3">
                          <button onClick={() => handleOpenModal('caja', c)} className="p-2 rounded-xl bg-[var(--c-accion-pastel)] text-[var(--c-accion)] hover:scale-110 transition-all"><EditIcon /></button>
                          <button onClick={() => handleDelete('caja', c._id)} className="p-2 rounded-xl bg-[var(--c-danger-pastel)] text-[var(--c-salida)] hover:scale-110 transition-all"><DeleteIcon /></button>
                        </td>
                      </tr>
                    ))}
                    {tabActiva === 'movimientos' && movimientos.filter(m => {
                      const matchSearch = m.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) || m.id_caja?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchFiltro = filtroMovimientos === 'TODOS' ? true : m.estado_comprobante === 'PENDIENTE_ASIGNACION';
                      const matchCaja = cajaFilter ? m.id_caja?._id === cajaFilter : true;
                      return matchSearch && matchFiltro && matchCaja;
                    }).map(m => {
                      const cajaData = cajas.find(c => c._id === (m.id_caja?._id || m.id_caja));
                      const colorCaja = cajaData?.color_primario || m.id_caja?.color_primario || '#3B59DA';
                      
                      return (
                      <tr key={m._id}>
                        <td className="text-[10px] font-bold opacity-60 uppercase">{new Date(m.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</td>
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
                            {m.id_caja?.nombre_caja || m.id_caja?.codigo}
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${!m.tipo ? 'bg-[var(--c-success-pastel)] text-green-700' : 'bg-[var(--c-danger-pastel)] text-red-700'}`}>
                            {!m.tipo ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="text-xs font-medium max-w-[200px] truncate" title={m.concepto}>{m.concepto}</td>
                        <td className={`font-black text-xs ${m.tipo ? 'text-[var(--c-salida)]' : 'text-[var(--c-entrada)]'}`}>
                          {m.tipo ? '-' : '+'}S/ {m.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right text-[11px] font-black opacity-60">S/ {m.saldo_resultante?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-[var(--c-primario)] opacity-50">{m.tipo_comprobante || 'S/C'}</span>
                            <span className="text-[10px] font-mono font-bold text-[var(--c-accion)]">{m.numero_comprobante || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${m.estado_comprobante === 'ASIGNADO' ? 'badge-success' : m.estado_comprobante === 'RECHAZADO' ? 'badge-danger' : 'badge-warning'}`}>
                            {m.estado_comprobante === 'PENDIENTE_ASIGNACION' ? 'Pendiente' : m.estado_comprobante}
                          </span>
                        </td>
                        <td className="flex justify-center gap-3">
                          {m.estado_comprobante === 'PENDIENTE_ASIGNACION' && (
                            <>
                              <button onClick={() => handleAprobarMovimiento(m._id)} title="Aprobar" className="p-2 rounded-xl bg-[var(--c-success-pastel)] text-green-600 hover:scale-110 transition-all"><CheckIcon /></button>
                              <button onClick={() => handleRechazarMovimiento(m._id)} title="Rechazar" className="p-2 rounded-xl bg-[var(--c-danger-pastel)] text-[var(--c-salida)] hover:scale-110 transition-all"><XIcon /></button>
                            </>
                          )}
                        </td>
                      </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
          {/* Capital Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 mb-10 animate-fadeIn delay-100">
            <div className="lg:col-span-12">
              <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 w-full h-[300px]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[var(--c-primario)] mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--c-accion)] rounded-full"></span>
                    Distribución de Capital
                  </h3>
                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={cajas.map(c => {
                          let color = c.color_primario;
                          const n = c.nombre_caja.toLowerCase();
                          if (n.includes('efectivo')) color = '#22C55E';
                          else if (n.includes('bbva') || n.includes('continental')) color = '#2563EB';
                          else if (n.includes('interbank')) color = '#FACC15';
                          else if (n.includes('nacion')) color = '#DC2626';
                          else if (n.includes('bcp') || n.includes('credito')) color = '#7C3AED';
                          return { name: c.nombre_caja, value: c.saldo_actual, color };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1500}
                        stroke="none"
                      >
                        {cajas.map((c, index) => {
                          let color = c.color_primario || '#3B59DA';
                          const n = c.nombre_caja.toLowerCase();
                          if (n.includes('efectivo')) color = '#22C55E';
                          else if (n.includes('bbva') || n.includes('continental')) color = '#2563EB';
                          else if (n.includes('interbank')) color = '#FACC15';
                          else if (n.includes('nacion')) color = '#DC2626';
                          else if (n.includes('bcp') || n.includes('credito')) color = '#7C3AED';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--c-fondo-card)', 
                          borderRadius: '16px', 
                          border: '1px solid var(--c-borde)',
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 shrink-0 pr-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {cajas.map((c, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color_primario }}></div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--c-texto-sub)] flex items-center gap-2">
                            {c.nombre_caja}
                            <span className="text-[7px] bg-[var(--c-secundario)] px-1 rounded border border-[var(--c-borde)]">{c.id_sede?.nombre || 'Sede Local'}</span>
                          </p>
                          <p className="text-sm font-black text-[var(--c-primario)]">S/ {c.saldo_actual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

      </div>

      {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--c-primario)]/20 backdrop-blur-md animate-fadeIn">
            <div className="bg-[var(--c-fondo-card)] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleIn border border-[var(--c-borde)]">
              <div className="relative px-8 py-10">
                <button onClick={handleCloseModal} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--c-secundario)] transition-colors text-[var(--c-texto-sub)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="mb-8">
                  <span className="text-[var(--c-accion)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[var(--c-accion-pastel)] rounded-full mb-3 inline-block">Formulario de Gestión</span>
                  <h3 className="text-3xl font-heading font-bold text-[var(--c-primario)]">
                    {isEditing ? 'Actualizar' : 'Registrar'} {modalType === 'usuario' ? 'Usuario' : modalType === 'sede' ? 'Sede' : 'Tipo de Caja'}
                  </h3>
                  <p className="text-[var(--c-texto-sub)] text-sm mt-1">Complete los campos detallados a continuación para {isEditing ? 'modificar los datos existentes' : 'crear un nuevo registro en el sistema'}.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {modalType === 'usuario' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
                        <input required className="premium-input" name="nombre" value={formData.nombre || ''} onChange={handleChange} placeholder="Ej: Juan Pérez" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Nombre de Usuario</label>
                        <input required className="premium-input" name="login_usuario" value={formData.login_usuario || ''} onChange={handleChange} placeholder="jperez" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Contraseña {isEditing && '(Opcional)'}</label>
                        <input required={!isEditing} type="password" className="premium-input" name="password" value={formData.password || ''} onChange={handleChange} placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Nivel de Acceso</label>
                        <select required className="premium-input" name="rol" value={formData.rol || 'CAJERO_SEDE'} onChange={handleChange}>
                          <option value="CAJERO_SEDE">Cajero de Sede</option>
                          <option value="ADMINISTRADOR">Administrador Maestro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Sede de Operación</label>
                        <select required className="premium-input" name="id_sede" value={formData.id_sede || ''} onChange={handleChange}>
                          <option value="" disabled>Vincular a sede...</option>
                          {sedes.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {modalType === 'sede' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Nombre de la Sede</label>
                        <input required className="premium-input" name="nombre" value={formData.nombre || ''} onChange={handleChange} placeholder="Sede Principal" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Dirección Física</label>
                        <input required className="premium-input" name="direccion" value={formData.direccion || ''} onChange={handleChange} placeholder="Av. Los Pinos 123..." />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-[var(--c-secundario)] rounded-2xl border border-[var(--c-borde)]">
                        <input type="checkbox" name="estado" id="estado_sede" checked={formData.estado ?? true} onChange={handleChange} className="w-5 h-5 accent-[var(--c-accion)] rounded-lg cursor-pointer" />
                        <label htmlFor="estado_sede" className="text-sm font-bold text-[var(--c-primario)] cursor-pointer">Sede habilitada para operaciones</label>
                      </div>
                    </div>
                  )}

                  {modalType === 'caja' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Código Único</label>
                        <input required className="premium-input font-mono uppercase" name="codigo" value={formData.codigo || ''} onChange={handleChange} placeholder="CJ-01" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-2 ml-1">Denominación</label>
                        <input required className="premium-input" name="nombre_caja" value={formData.nombre_caja || ''} onChange={handleChange} placeholder="Caja General" />
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-[var(--c-secundario)] rounded-2xl border border-[var(--c-borde)]">
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-widest mb-1">Mínimo sugerido</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--c-texto-sub)]">S/</span>
                            <input required type="number" className="premium-input !pl-8" name="saldo_minimo" value={formData.saldo_minimo || 0} onChange={handleChange} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-widest mb-1">Límite máximo</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--c-texto-sub)]">S/</span>
                            <input required type="number" className="premium-input !pl-8" name="saldo_maximo" value={formData.saldo_maximo || 0} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-[var(--c-primario)] uppercase tracking-wider mb-3 ml-1">Identidad de la Caja (Bancos)</label>
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { name: 'Efectivo', p: '#22C55E' },
                            { name: 'BBVA', p: '#2563EB' },
                            { name: 'Interbank', p: '#FACC15' },
                            { name: 'B. Nación', p: '#DC2626' },
                            { name: 'BCP', p: '#7C3AED' }
                          ].map(bank => (
                            <button
                              key={bank.name}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, color_primario: bank.p, color_secundario: bank.p }))}
                              className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${formData.color_primario === bank.p ? 'border-[var(--c-accion)] bg-[var(--c-fondo-card)] shadow-sm' : 'border-transparent bg-[var(--c-secundario)] opacity-60 hover:opacity-100'}`}
                            >
                              <div className="w-8 h-8 rounded-lg shadow-sm" style={{ background: bank.p }}></div>
                              <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-none">{bank.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                         <div className="flex items-start gap-3 p-3 bg-[var(--c-accion-pastel)] rounded-xl border border-[var(--c-accion)]/10">
                            <svg className="w-5 h-5 text-[var(--c-accion)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-[11px] text-[var(--c-primario)] font-medium leading-tight">Este tipo de caja se replicará automáticamente en todas las sedes activas del sistema.</p>
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-[var(--c-borde)]">
                    <button type="button" onClick={handleCloseModal} className="px-6 py-3 text-sm font-bold text-[var(--c-texto-sub)] hover:text-[var(--c-primario)] transition-colors">Descartar</button>
                    <button type="submit" className="btn-gold !px-10 !py-3.5 !text-sm">
                      {isEditing ? 'Confirmar Cambios' : 'Crear Registro'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      {/* Modal Premium de Eliminación */}
      {modalEliminar.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--c-primario)]/20 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--c-fondo-card)] rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-[var(--c-borde)] animate-scaleIn">
            <div className="p-8 text-center relative">
              <button onClick={() => setModalEliminar({ isOpen: false, type: null, id: null })} className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--c-secundario)] transition-colors text-[var(--c-texto-sub)]">
                <XIcon />
              </button>
              <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-5 border-4 border-red-500/10">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--c-primario)] mb-3">¿Confirmar Eliminación?</h3>
              <p className="text-sm text-[var(--c-texto-sub)] mb-8 leading-relaxed">
                Estás a punto de eliminar este registro de <span className="font-bold text-[var(--c-primario)] uppercase px-2 py-0.5 bg-[var(--c-secundario)] rounded border border-[var(--c-borde)]">{modalEliminar.type}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setModalEliminar({ isOpen: false, type: null, id: null })}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-[var(--c-borde)] bg-[var(--c-secundario)] text-[var(--c-texto-sub)] font-bold hover:text-[var(--c-primario)] hover:border-[var(--c-primario)]/30 transition-all text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarEliminacion}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 hover:shadow-red-500/30 transition-all text-xs uppercase tracking-wider border-2 border-transparent hover:border-white/20"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </main>
    </>
  );
};

export default AdminDashboard;
