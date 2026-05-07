import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const PerfilModal = ({ onClose }) => {
  const { usuario, actualizarUsuarioLocal } = useAuth();
  const [nombre, setNombre] = useState(usuario.nombre || '');
  const [passwordAntiguo, setPasswordAntiguo] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [avatarBase64, setAvatarBase64] = useState(usuario.avatar || '');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMensaje({ tipo: 'error', texto: 'La imagen no debe superar los 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      if (password && password !== passwordConfirm) {
        setMensaje({ tipo: 'error', texto: 'Las nuevas contraseñas no coinciden' });
        setCargando(false);
        return;
      }

      const payload = { nombre, avatar: avatarBase64 };
      if (password) {
        payload.password = password;
        payload.passwordAntiguo = passwordAntiguo;
      }

      const { data } = await API.put(`/usuarios/${usuario._id}`, payload);
      actualizarUsuarioLocal({ 
        nombre: data.usuario.nombre, 
        avatar: data.usuario.avatar,
        rol: data.usuario.rol,
        id_sede: data.usuario.id_sede
      });
      setMensaje({ tipo: 'exito', texto: 'Perfil actualizado correctamente' });
      setPasswordAntiguo('');
      setPassword('');
      setPasswordConfirm('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'Error al actualizar perfil' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--c-primario)]/20 backdrop-blur-md animate-fadeIn">
      <div className="bg-[var(--c-fondo-card)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn border border-[var(--c-borde)]">
        
        {/* Header Section */}
        <div className="relative px-8 pt-10">
          <button onClick={onClose} className="absolute top-8 right-8 p-2 rounded-full hover:bg-[var(--c-secundario)] transition-colors text-[var(--c-texto-sub)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="mb-8">
            <span className="text-[var(--c-accion)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[var(--c-accion-pastel)] rounded-full mb-3 inline-block">Configuración de Cuenta</span>
            <h3 className="text-3xl font-heading font-bold text-[var(--c-primario)]">Actualizar Perfil</h3>
            <p className="text-[var(--c-texto-sub)] text-sm mt-1">Gestione sus credenciales de acceso e identidad visual en el sistema.</p>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`mx-8 mb-6 p-4 rounded-2xl flex items-center gap-3 animate-slideIn ${
            mensaje.tipo === 'exito' ? 'bg-[var(--c-success-pastel)] text-green-800' : 'bg-[var(--c-danger-pastel)] text-red-800'
          }`}>
            <div className="flex-1 text-xs font-bold uppercase tracking-wider">{mensaje.texto}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
          {/* Identity Section */}
          <div className="flex items-center gap-8 p-6 bg-[var(--c-secundario)] rounded-[24px] border border-[var(--c-borde)]">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-[28px] overflow-hidden border border-[var(--c-borde)] shadow-md bg-[var(--c-fondo)] p-1">
                <div className="w-full h-full rounded-[24px] overflow-hidden bg-[var(--c-secundario)]">
                  {avatarBase64 ? (
                    <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                       <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  )}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-[var(--c-primario)] text-white p-2.5 rounded-2xl shadow-lg hover:scale-110 transition-transform border-2 border-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            
            <div className="space-y-1">
               <h4 className="text-[10px] font-bold text-[var(--c-accion)] uppercase tracking-widest">Identidad Visual</h4>
               <p className="text-sm font-black text-[var(--c-primario)]">Personalice su avatar</p>
               <p className="text-[11px] text-[var(--c-texto-sub)] leading-tight">Formatos JPG/PNG hasta 2MB para una visualización óptima.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[var(--c-primario)] uppercase tracking-wider ml-1">Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="premium-input !bg-[var(--c-secundario)]"
                placeholder="Ej: Juan Pérez..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--c-texto-sub)] uppercase tracking-wider ml-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={passwordAntiguo}
                  onChange={(e) => setPasswordAntiguo(e.target.value)}
                  className="premium-input !bg-[var(--c-secundario)]"
                  placeholder="********"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--c-texto-sub)] uppercase tracking-wider ml-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="premium-input !bg-[var(--c-secundario)]"
                  placeholder="Mín. 6 car."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--c-texto-sub)] uppercase tracking-wider ml-1">Confirmar Nueva</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="premium-input !bg-[var(--c-secundario)]"
                  placeholder="Confirmar..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-[var(--c-borde)]">
            <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold text-[var(--c-texto-sub)] hover:text-[var(--c-primario)] transition-colors">Descartar</button>
            <button type="submit" disabled={cargando} className="btn-gold !px-10 !py-3.5 shadow-lg">
              {cargando ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Confirmar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerfilModal;
