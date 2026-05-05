import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';

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
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [sedesRes, cajasRes, usuariosRes] = await Promise.all([
        API.get('/sedes'),
        API.get('/cajas'),
        API.get('/usuarios')
      ]);
      setSedes(sedesRes.data);
      setCajas(cajasRes.data);
      setUsuarios(usuariosRes.data);
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
      else if (type === 'caja') setFormData({ codigo: '', nombre_caja: '', saldo_minimo: 0, saldo_maximo: 0, id_sede: sedes[0]?._id || '' });
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
    } catch (error) {
      console.error('Error al guardar', error);
      alert('Error al guardar, verifique los datos');
    }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm(`¿Estás seguro de eliminar este ${type}?`)) {
      try {
        await API.delete(`/${type}s/${id}`);
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar', error);
        alert('Error al eliminar');
      }
    }
  };

  if (cargando) return <Loader mensaje="Cargando Administración..." />;

  return (
    <>
      <main className="min-h-screen p-8" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--c-primario)' }}>Gestión Administrativa</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-texto-sub)' }}>Administra usuarios, sedes y cajas del sistema.</p>
          </div>

          <div className="flex gap-4 mb-6 overflow-x-auto pb-2 animate-fadeIn delay-100 hidden">
            <button
              onClick={() => cambiarTab('usuarios')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${tabActiva === 'usuarios' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              style={tabActiva === 'usuarios' ? { background: 'var(--c-accion)' } : { background: 'var(--c-fondo-card)', color: 'var(--c-texto)' }}
            >
              <UsersIcon /> Usuarios
            </button>
            <button
              onClick={() => cambiarTab('sedes')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${tabActiva === 'sedes' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              style={tabActiva === 'sedes' ? { background: 'var(--c-accion)' } : { background: 'var(--c-fondo-card)', color: 'var(--c-texto)' }}
            >
              <SedeIcon /> Sedes
            </button>
            <button
              onClick={() => cambiarTab('cajas')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${tabActiva === 'cajas' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              style={tabActiva === 'cajas' ? { background: 'var(--c-accion)' } : { background: 'var(--c-fondo-card)', color: 'var(--c-texto)' }}
            >
              <CajaIcon /> Cajas
            </button>
          </div>

          <div className="card p-6 animate-slideLeft delay-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--c-primario)' }}>
                {tabActiva === 'usuarios' && 'Lista de Usuarios'}
                {tabActiva === 'sedes' && 'Lista de Sedes'}
                {tabActiva === 'cajas' && 'Lista de Cajas'}
              </h2>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="input-field !h-10 !w-64 !text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={() => handleOpenModal(tabActiva.slice(0, -1))} className="btn-primario">
                  + Crear Nuevo
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      {tabActiva === 'usuarios' && (
                        <>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Nombre</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Login</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Rol</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Sede</th>
                        </>
                      )}
                      {tabActiva === 'sedes' && (
                        <>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Nombre</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Dirección</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Estado</th>
                        </>
                      )}
                      {tabActiva === 'cajas' && (
                        <>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Código</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Nombre</th>
                          <th className="text-left py-3 px-4 font-medium opacity-80">Sede</th>
                          <th className="text-right py-3 px-4 font-medium opacity-80">Min/Max</th>
                        </>
                      )}
                      <th className="text-center py-3 px-4 font-medium opacity-80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabActiva === 'usuarios' && usuarios.filter(u => 
                      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      u.login_usuario.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(u => (
                      <tr key={u._id} className="table-row">
                        <td className="py-3 px-4 font-medium">{u.nombre}</td>
                        <td className="py-3 px-4 text-xs font-mono">{u.login_usuario}</td>
                        <td className="py-3 px-4"><span className="badge badge-aprobado">{u.rol}</span></td>
                        <td className="py-3 px-4">{u.id_sede?.nombre}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button onClick={() => handleOpenModal('usuario', u)} className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><EditIcon /></button>
                          <button onClick={() => handleDelete('usuario', u._id)} className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><DeleteIcon /></button>
                        </td>
                      </tr>
                    ))}
                    {tabActiva === 'sedes' && sedes.filter(s => 
                      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      s.direccion.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(s => (
                      <tr key={s._id} className="table-row">
                        <td className="py-3 px-4 font-medium">{s.nombre}</td>
                        <td className="py-3 px-4">{s.direccion}</td>
                        <td className="py-3 px-4"><span className={`badge ${s.estado ? 'badge-entrada' : 'badge-salida'}`}>{s.estado ? 'Activo' : 'Inactivo'}</span></td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button onClick={() => handleOpenModal('sede', s)} className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><EditIcon /></button>
                          <button onClick={() => handleDelete('sede', s._id)} className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><DeleteIcon /></button>
                        </td>
                      </tr>
                    ))}
                    {tabActiva === 'cajas' && cajas.filter(c => 
                      c.nombre_caja.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(c => (
                      <tr key={c._id} className="table-row">
                        <td className="py-3 px-4 font-mono font-bold text-xs" style={{ color: 'var(--c-accion)' }}>{c.codigo}</td>
                        <td className="py-3 px-4 font-medium">{c.nombre_caja}</td>
                        <td className="py-3 px-4">{c.id_sede?.nombre}</td>
                        <td className="py-3 px-4 text-right text-xs">S/ {c.saldo_minimo} - S/ {c.saldo_maximo}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button onClick={() => handleOpenModal('caja', c)} className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><EditIcon /></button>
                          <button onClick={() => handleDelete('caja', c._id)} className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><DeleteIcon /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="card w-full max-w-md p-6 relative animate-scaleIn">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--c-primario)' }}>
                {isEditing ? 'Editar' : 'Nuevo'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType === 'usuario' && (
                  <>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Nombre</label><input required className="input-field" name="nombre" value={formData.nombre || ''} onChange={handleChange} /></div>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Login (Usuario)</label><input required className="input-field" name="login_usuario" value={formData.login_usuario || ''} onChange={handleChange} /></div>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Contraseña {isEditing && '(Opcional)'}</label><input required={!isEditing} type="password" className="input-field" name="password" value={formData.password || ''} onChange={handleChange} /></div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Rol</label>
                      <select required className="input-field" name="rol" value={formData.rol || 'CAJERO_SEDE'} onChange={handleChange}>
                        <option value="CAJERO_SEDE">Cajero Sede</option>
                        <option value="ADMINISTRADOR">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Sede Asignada</label>
                      <select required className="input-field" name="id_sede" value={formData.id_sede || ''} onChange={handleChange}>
                        <option value="" disabled>Seleccione sede...</option>
                        {sedes.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'sede' && (
                  <>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Nombre</label><input required className="input-field" name="nombre" value={formData.nombre || ''} onChange={handleChange} /></div>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Dirección</label><input required className="input-field" name="direccion" value={formData.direccion || ''} onChange={handleChange} /></div>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" name="estado" checked={formData.estado ?? true} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                      <label className="text-sm font-medium" style={{ color: 'var(--c-texto)' }}>Sede Activa</label>
                    </div>
                  </>
                )}

                {modalType === 'caja' && (
                  <>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Código</label><input required className="input-field" name="codigo" value={formData.codigo || ''} onChange={handleChange} /></div>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Nombre / Tipo de Caja</label><input required className="input-field" name="nombre_caja" value={formData.nombre_caja || ''} onChange={handleChange} /></div>
                    <div className="flex gap-4">
                      <div className="w-1/2"><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Saldo Mínimo Sugerido</label><input required type="number" className="input-field" name="saldo_minimo" value={formData.saldo_minimo || 0} onChange={handleChange} /></div>
                      <div className="w-1/2"><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-texto-sub)' }}>Saldo Máximo Permitido</label><input required type="number" className="input-field" name="saldo_maximo" value={formData.saldo_maximo || 0} onChange={handleChange} /></div>
                    </div>
                    <p className="text-[10px] text-blue-500 font-bold mt-2 italic">* Este tipo de caja se habilitará automáticamente en todas las sedes.</p>
                  </>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--c-borde)' }}>
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancelar</button>
                  <button type="submit" className="btn-primario">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </>
  );
};

export default AdminDashboard;
