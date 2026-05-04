import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const PerfilModal = ({ onClose }) => {
  const { usuario, actualizarUsuarioLocal } = useAuth();
  const [nombre, setNombre] = useState(usuario.nombre || '');
  const [password, setPassword] = useState('');
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
      const payload = { nombre, avatar: avatarBase64 };
      if (password) {
        payload.password = password;
      }

      const { data } = await API.put(`/usuarios/${usuario._id}`, payload);
      actualizarUsuarioLocal({ nombre: data.usuario.nombre, avatar: data.usuario.avatar });
      setMensaje({ tipo: 'exito', texto: 'Perfil actualizado correctamente' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--c-fondo-card)] border border-[var(--c-borde)] w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-scaleIn">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-[var(--c-borde)] pb-4">
          <h2 className="text-xl font-bold text-[var(--c-primario)]">Editar Perfil</h2>
          <button onClick={onClose} className="text-[var(--c-texto-sub)] hover:text-[var(--c-salida)] transition-colors cursor-pointer bg-transparent border-none">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mensaje.texto && (
          <div className={`px-4 py-3 rounded-xl mb-5 text-sm animate-fadeIn ${mensaje.tipo === 'exito' ? 'alerta-exito' : 'alerta-error'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--c-borde)] shadow-sm bg-[var(--c-secundario)] flex items-center justify-center">
                {avatarBase64 ? (
                  <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-[var(--c-texto-sub)] opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[var(--c-accion)] text-white p-2 rounded-full shadow-lg border-none cursor-pointer hover:scale-110 transition-transform"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <p className="text-xs text-[var(--c-texto-sub)]">Haz clic en la cámara para subir foto</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--c-texto)]">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="input-field"
              placeholder="Tu nombre"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--c-texto)]">
              Nueva Contraseña <span className="text-[var(--c-texto-sub)] text-xs font-normal">(Opcional)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--c-borde)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--c-secundario)] text-[var(--c-texto)] hover:bg-[var(--c-borde)] transition-colors border-none cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn-primario py-2 px-5"
            >
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerfilModal;
