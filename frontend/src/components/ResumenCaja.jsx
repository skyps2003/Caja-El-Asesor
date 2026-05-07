import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/ResumenCaja.css';

const ResumenCaja = ({ id_caja, nombreCaja, onPeriodoChange }) => {
  const { token } = useAuth();
  const [periodo, setPeriodo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [id_caja, token]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const resPeriodo = await axios.get(`/api/periodos/${id_caja}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPeriodo(resPeriodo.data.periodo);

      const resMovimientos = await axios.get(`/api/movimientos/caja/${id_caja}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovimientos(resMovimientos.data.slice(0, 5)); // Últimos 5
      setError('');

      if (onPeriodoChange) {
        onPeriodoChange(resPeriodo.data.periodo);
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="resumen-loading">Cargando...</div>;
  if (error) return <div className="resumen-error">{error}</div>;
  if (!periodo) return <div className="resumen-empty">Sin datos</div>;

  const porcentajeUtilizacion =
    periodo.saldo_inicial > 0
      ? ((periodo.saldo_actual / periodo.saldo_inicial) * 100).toFixed(1)
      : 0;

  return (
    <div className="resumen-caja">
      <div className="resumen-header">
        <h3>{nombreCaja}</h3>
        <span className={`estado-badge ${periodo.estado.toLowerCase()}`}>
          {periodo.estado}
        </span>
      </div>

      <div className="resumen-metricas">
        <div className="metrica saldo-inicial">
          <label>Saldo Inicial</label>
          <div className="valor">S/. {periodo.saldo_inicial?.toFixed(2)}</div>
        </div>

        <div className="metrica saldo-actual">
          <label>Saldo Actual</label>
          <div className="valor">S/. {periodo.saldo_actual?.toFixed(2)}</div>
          <div className="barra-progreso">
            <div className="progreso" style={{ width: `${Math.min(porcentajeUtilizacion, 100)}%` }}></div>
          </div>
        </div>

        <div className="metrica ingresos">
          <label>Ingresos</label>
          <div className="valor positivo">+S/. {periodo.total_ingresos?.toFixed(2)}</div>
        </div>

        <div className="metrica egresos">
          <label>Egresos</label>
          <div className="valor negativo">-S/. {periodo.total_egresos?.toFixed(2)}</div>
        </div>
      </div>

      {movimientos.length > 0 && (
        <div className="resumen-ultimos">
          <h4>Últimos Movimientos</h4>
          <div className="movimientos-list">
            {movimientos.map((mov) => (
              <div key={mov._id} className="movimiento-item">
                <div className="mov-icono">
                  {mov.tipo === false || mov.tipo === 0 ? '📥' : '📤'}
                </div>
                <div className="mov-info">
                  <p className="mov-concepto">{mov.concepto}</p>
                  <p className="mov-fecha">
                    {new Date(mov.fecha_hora).toLocaleTimeString('es-ES')}
                  </p>
                </div>
                <div className={`mov-monto ${mov.tipo === false || mov.tipo === 0 ? 'positivo' : 'negativo'}`}>
                  {mov.tipo === false || mov.tipo === 0 ? '+' : '-'}S/. {mov.monto.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenCaja;
