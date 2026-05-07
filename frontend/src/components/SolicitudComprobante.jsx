import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/SolicitudComprobante.css';

const SolicitudComprobante = ({ onSuccess }) => {
  const { usuario, token } = useAuth();
  const [formData, setFormData] = useState({
    tipo_comprobante: 'RECIBO',
    numero_solicitado: '',
    cantidad_solicitada: 1,
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'cantidad_solicitada' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Obtener la sede del usuario (esto requiere que el usuario tenga id_sede)
      const response = await axios.post(
        '/api/comprobantes/solicitar',
        {
          ...formData,
          id_sede: usuario.id_sede, // Asumiendo que el usuario tiene id_sede
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: 'success',
        text: 'Solicitud enviada exitosamente. Está pendiente de aprobación.',
      });

      // Resetear el formulario
      setFormData({
        tipo_comprobante: 'RECIBO',
        numero_solicitado: '',
        cantidad_solicitada: 1,
        descripcion: '',
      });

      if (onSuccess) {
        onSuccess(response.data.comprobante);
      }

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.mensaje || 'Error al enviar solicitud',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="solicitud-comprobante-container">
      <div className="solicitud-card">
        <h3>Solicitar Comprobante</h3>

        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="solicitud-form">
          <div className="form-group">
            <label htmlFor="tipo_comprobante">Tipo de Comprobante:</label>
            <select
              id="tipo_comprobante"
              name="tipo_comprobante"
              value={formData.tipo_comprobante}
              onChange={handleChange}
              required
            >
              <option value="RECIBO">Recibo</option>
              <option value="FACTURA">Factura</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="numero_solicitado">Número:</label>
            <input
              type="text"
              id="numero_solicitado"
              name="numero_solicitado"
              value={formData.numero_solicitado}
              onChange={handleChange}
              placeholder={
                formData.tipo_comprobante === 'FACTURA'
                  ? 'FAC-2026-001'
                  : '001'
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cantidad_solicitada">Cantidad:</label>
            <input
              type="number"
              id="cantidad_solicitada"
              name="cantidad_solicitada"
              value={formData.cantidad_solicitada}
              onChange={handleChange}
              min="1"
              max="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción (opcional):</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción del propósito..."
              rows="3"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>

        <div className="info-box">
          <strong>Nota:</strong>
          <p>
            Tu solicitud será revisada y aprobada por un administrador. Una vez
            aprobada, podrás asignar los números de comprobante a tus transacciones.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolicitudComprobante;
