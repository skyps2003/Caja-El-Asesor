import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/PeriodoMensual.css';

const PeriodoMensual = ({ id_caja }) => {
  const { token } = useAuth();
  const [periodo, setPeriodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalCierre, setModalCierre] = useState({
    visible: false,
    saldo_real: '',
  });

  useEffect(() => {
    cargarPeriodo();
  }, [id_caja, token]);

  const cargarPeriodo = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/periodos/${id_caja}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPeriodo(res.data.periodo);
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cargar período');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarMes = async () => {
    if (!modalCierre.saldo_real || isNaN(modalCierre.saldo_real)) {
      alert('Debe ingresar un saldo real válido');
      return;
    }

    try {
      await axios.post(
        `/api/periodos/${id_caja}/cerrar`,
        { saldo_real: parseFloat(modalCierre.saldo_real) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Período mensual cerrado exitosamente');
      setModalCierre({ visible: false, saldo_real: '' });
      await cargarPeriodo();
    } catch (err) {
      alert('Error al cerrar período: ' + err.response?.data?.mensaje);
    }
  };

  if (loading) return <div className="periodo-loading">Cargando...</div>;
  if (error) return <div className="periodo-error">{error}</div>;
  if (!periodo) return <div className="periodo-empty">No hay período activo</div>;

  const diferencia = periodo.saldo_actual - periodo.saldo_final;
  const diferenciaPorcentaje =
    periodo.saldo_inicial > 0
      ? ((diferencia / periodo.saldo_inicial) * 100).toFixed(2)
      : 0;

  return (
    <div className="periodo-container">
      <div className="periodo-header">
        <h3>Período Mensual Actual</h3>
        <span className={`estado-badge ${periodo.estado.toLowerCase()}`}>
          {periodo.estado}
        </span>
      </div>

      <div className="periodo-grid">
        <div className="periodo-item">
          <label>Saldo Inicial</label>
          <div className="valor">S/. {periodo.saldo_inicial?.toFixed(2) || '0.00'}</div>
        </div>

        <div className="periodo-item">
          <label>Total Ingresos</label>
          <div className="valor positivo">
            +S/. {periodo.total_ingresos?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="periodo-item">
          <label>Total Egresos</label>
          <div className="valor negativo">
            -S/. {periodo.total_egresos?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="periodo-item">
          <label>Saldo Actual</label>
          <div className="valor principal">
            S/. {periodo.saldo_actual?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {periodo.estado === 'ABIERTO' && (
        <div className="periodo-acciones">
          <button
            className="btn btn-cerrar-mes"
            onClick={() => setModalCierre({ ...modalCierre, visible: true })}
          >
            Cerrar Mes
          </button>
        </div>
      )}

      {periodo.estado === 'CERRADO' && (
        <div className="periodo-cierre-info">
          <h4>Información de Cierre</h4>
          <div className="cierre-grid">
            <div className="cierre-item">
              <label>Saldo Real</label>
              <p>S/. {periodo.saldo_final?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="cierre-item">
              <label>Diferencia</label>
              <p className={`diferencia ${diferencia >= 0 ? 'positiva' : 'negativa'}`}>
                {diferencia >= 0 ? '+' : ''}S/. {diferencia?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="cierre-item">
              <label>Cerrado por</label>
              <p>{periodo.id_usuario_cierre?.login_usuario || 'N/A'}</p>
            </div>
            <div className="cierre-item">
              <label>Fecha de Cierre</label>
              <p>{new Date(periodo.fecha_fin).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cierre */}
      {modalCierre.visible && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cerrar Período Mensual</h3>
            <p className="modal-subtitle">
              Ingrese el saldo real observado en caja para finalizar el mes
            </p>

            <div className="modal-info">
              <p>
                <strong>Saldo Esperado:</strong> S/. {periodo.saldo_actual?.toFixed(2)}
              </p>
            </div>

            <input
              type="number"
              className="modal-input"
              placeholder="Saldo Real"
              value={modalCierre.saldo_real}
              onChange={(e) =>
                setModalCierre({
                  ...modalCierre,
                  saldo_real: e.target.value,
                })
              }
              step="0.01"
              min="0"
            />

            <div className="modal-acciones">
              <button className="btn btn-success" onClick={handleCerrarMes}>
                Confirmar Cierre
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setModalCierre({ visible: false, saldo_real: '' })}
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

export default PeriodoMensual;
