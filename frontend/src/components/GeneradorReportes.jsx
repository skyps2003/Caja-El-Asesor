import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/GeneradorReportes.css';

const GeneradorReportes = ({ id_caja, nombreCaja }) => {
  const { token } = useAuth();
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [formulario, setFormulario] = useState({
    tipo: 'mensual',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario({
      ...formulario,
      [name]: name === 'tipo' ? value : parseInt(value),
    });
  };

  const generarReporte = async () => {
    try {
      setGenerando(true);
      setMensaje('');

      if (formulario.tipo === 'mensual') {
        const response = await axios.post(
          '/api/reportes/mensual',
          {
            id_caja,
            mes: formulario.mes,
            anio: formulario.anio,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );

        // Crear descarga
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Reporte_${formulario.mes}_${formulario.anio}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        setMensaje({
          type: 'success',
          text: 'Reporte descargado exitosamente',
        });
      } else {
        const response = await axios.post(
          '/api/reportes/general',
          { id_caja },
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Resumen_General.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        setMensaje({
          type: 'success',
          text: 'Resumen general descargado exitosamente',
        });
      }

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje({
        type: 'error',
        text: error.response?.data?.mensaje || 'Error al generar reporte',
      });
    } finally {
      setGenerando(false);
    }
  };

  const mesesOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const aniosOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year };
  });

  return (
    <div className="generador-reportes">
      <h3>📊 Generar Reportes Excel</h3>

      {mensaje && (
        <div className={`mensaje mensaje-${mensaje.type}`}>
          {mensaje.text}
        </div>
      )}

      <div className="formulario-reporte">
        <div className="form-group">
          <label htmlFor="tipo">Tipo de Reporte:</label>
          <select
            id="tipo"
            name="tipo"
            value={formulario.tipo}
            onChange={handleChange}
            disabled={generando}
          >
            <option value="mensual">Mensual</option>
            <option value="general">Resumen General</option>
          </select>
        </div>

        {formulario.tipo === 'mensual' && (
          <>
            <div className="form-group">
              <label htmlFor="mes">Mes:</label>
              <select
                id="mes"
                name="mes"
                value={formulario.mes}
                onChange={handleChange}
                disabled={generando}
              >
                {mesesOptions.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="anio">Año:</label>
              <select
                id="anio"
                name="anio"
                value={formulario.anio}
                onChange={handleChange}
                disabled={generando}
              >
                {aniosOptions.map((anio) => (
                  <option key={anio.value} value={anio.value}>
                    {anio.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <button
        className="btn-generar"
        onClick={generarReporte}
        disabled={generando}
      >
        {generando ? 'Generando...' : '📥 Descargar Reporte'}
      </button>

      <div className="info-box">
        <strong>Información:</strong>
        <p>
          Los reportes incluyen un resumen del período y el detalle completo
          de movimientos. Se descargarán en formato Excel (.xlsx).
        </p>
      </div>
    </div>
  );
};

export default GeneradorReportes;
