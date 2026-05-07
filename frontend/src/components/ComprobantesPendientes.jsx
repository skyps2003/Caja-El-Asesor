import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/ComprobantePendiente.css';

const ComprobantesPendientes = () => {
  const { usuario, token } = useAuth();
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [modalRechazar, setModalRechazar] = useState({
    visible: false,
    id: null,
    motivo: '',
  });

  useEffect(() => {
    cargarComprobantes();
  }, [token]);

  const cargarComprobantes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/comprobantes/pendientes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComprobantes(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cargar comprobantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id_comprobante) => {
    try {
      await axios.put(
        `/api/comprobantes/${id_comprobante}/aprobar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await cargarComprobantes();
      alert('Comprobante aprobado exitosamente');
    } catch (err) {
      alert('Error al aprobar comprobante: ' + err.response?.data?.mensaje);
    }
  };

  const handleRechazarClick = (id_comprobante) => {
    setModalRechazar({
      visible: true,
      id: id_comprobante,
      motivo: '',
    });
  };

  const handleRechazarConfirmar = async () => {
    if (!modalRechazar.motivo.trim()) {
      alert('Debe proporcionar un motivo de rechazo');
      return;
    }

    try {
      await axios.put(
        `/api/comprobantes/${modalRechazar.id}/rechazar`,
        { motivo_rechazo: modalRechazar.motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await cargarComprobantes();
      setModalRechazar({ visible: false, id: null, motivo: '' });
      alert('Comprobante rechazado exitosamente');
    } catch (err) {
      alert('Error al rechazar comprobante: ' + err.response?.data?.mensaje);
    }
  };

  const comprobantesFiltrados = comprobantes.filter((c) => {
    if (filtro === 'TODOS') return true;
    return c.tipo_comprobante === filtro;
  });

  if (loading) return <div className="container loading">Cargando...</div>;

  return (
    <div className="container comprobantes-container">
      <h2>Gestión de Comprobantes Pendientes</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="comprobantes-header">
        <div className="filtros">
          <button
            className={`btn-filtro ${filtro === 'TODOS' ? 'activo' : ''}`}
            onClick={() => setFiltro('TODOS')}
          >
            Todos ({comprobantes.length})
          </button>
          <button
            className={`btn-filtro ${filtro === 'FACTURA' ? 'activo' : ''}`}
            onClick={() => setFiltro('FACTURA')}
          >
            Facturas ({comprobantes.filter((c) => c.tipo_comprobante === 'FACTURA').length})
          </button>
          <button
            className={`btn-filtro ${filtro === 'RECIBO' ? 'activo' : ''}`}
            onClick={() => setFiltro('RECIBO')}
          >
            Recibos ({comprobantes.filter((c) => c.tipo_comprobante === 'RECIBO').length})
          </button>
        </div>
      </div>

      {comprobantesFiltrados.length === 0 ? (
        <div className="empty-state">
          <p>No hay comprobantes pendientes de aprobación</p>
        </div>
      ) : (
        <div className="comprobantes-grid">
          {comprobantesFiltrados.map((comprobante) => (
            <div key={comprobante._id} className="comprobante-card">
              <div className="comprobante-header">
                <h3>{comprobante.tipo_comprobante}</h3>
                <span className="comprobante-numero">{comprobante.numero_solicitado}</span>
              </div>

              <div className="comprobante-body">
                <div className="info-item">
                  <label>Solicitante:</label>
                  <p>{comprobante.id_usuario_creador.login_usuario}</p>
                </div>

                <div className="info-item">
                  <label>Cantidad Solicitada:</label>
                  <p>{comprobante.cantidad_solicitada}</p>
                </div>

                <div className="info-item">
                  <label>Descripción:</label>
                  <p>{comprobante.descripcion || 'Sin descripción'}</p>
                </div>

                <div className="info-item">
                  <label>Fecha Solicitud:</label>
                  <p>{new Date(comprobante.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="comprobante-acciones">
                <button
                  className="btn btn-success"
                  onClick={() => handleAprobar(comprobante._id)}
                >
                  ✓ Aprobar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRechazarClick(comprobante._id)}
                >
                  ✗ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Rechazo */}
      {modalRechazar.visible && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Rechazar Comprobante</h3>
            <textarea
              className="modal-textarea"
              placeholder="Motivo del rechazo..."
              value={modalRechazar.motivo}
              onChange={(e) =>
                setModalRechazar({
                  ...modalRechazar,
                  motivo: e.target.value,
                })
              }
            />
            <div className="modal-acciones">
              <button className="btn btn-danger" onClick={handleRechazarConfirmar}>
                Rechazar
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setModalRechazar({ visible: false, id: null, motivo: '' })}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprobantesPendientes;
