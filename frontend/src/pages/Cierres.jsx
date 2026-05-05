import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatSol = (n = 0) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
const formatFecha = (f) => new Date(f).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
const formatFechaCorta = (f) => new Date(f).toLocaleDateString('es-PE');

const DiffBadge = ({ diferencia }) => {
  const v = Number(diferencia || 0);
  if (v === 0) return <span className="badge badge-aprobado">CUADRADO</span>;
  if (v > 0) return <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>+{formatSol(v)}</span>;
  return <span className="badge badge-salida">{formatSol(v)}</span>;
};

// ─── Generador de PDF ───────────────────────────────────────────────────────
const generarPDF = (datos, tipoPeriodo, nombreSede) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();

  // Cabecera
  doc.setFillColor(30, 50, 130);
  doc.rect(0, 0, ancho, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE MOVIMIENTOS', ancho / 2, 13, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${tipoPeriodo === 'DIARIO' ? 'Cierre Diario' : 'Cierre Mensual'} — Sede: ${nombreSede}`, ancho / 2, 22, { align: 'center' });

  // Resumen
  let y = 38;
  doc.setTextColor(30, 50, 130);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DEL PERÍODO', 14, y);
  y += 6;

  doc.setDrawColor(200, 200, 220);
  doc.setFillColor(245, 247, 255);
  doc.roundedRect(14, y, ancho - 28, 28, 2, 2, 'FD');

  doc.setTextColor(80, 80, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Período:', 20, y + 7);
  doc.text(`Fecha inicio: ${formatFechaCorta(datos.fecha_inicio)}`, 20, y + 13);
  doc.text(`Movimientos: ${datos.total_movimientos}`, 20, y + 19);

  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Ingresos: ${formatSol(datos.total_ingresos)}`, ancho / 2, y + 7, { align: 'center' });
  doc.setTextColor(220, 38, 38);
  doc.text(`Total Egresos:  ${formatSol(datos.total_egresos)}`, ancho / 2, y + 14, { align: 'center' });
  doc.setTextColor(30, 50, 130);
  doc.text(`Neto:           ${formatSol(datos.neto)}`, ancho / 2, y + 21, { align: 'center' });

  y += 35;

  // Tabla de movimientos
  doc.setTextColor(30, 50, 130);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE MOVIMIENTOS', 14, y);
  y += 4;

  const filas = datos.movimientos.map((m) => [
    formatFecha(m.fecha_hora),
    m.id_caja?.codigo || '—',
    m.id_caja?.nombre_caja || '—',
    m.tipo ? 'SALIDA' : 'ENTRADA',
    m.concepto || '—',
    formatSol(m.monto),
    formatSol(m.saldo_resultante),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Cód.', 'Caja', 'Tipo', 'Concepto', 'Monto', 'Saldo']],
    body: filas,
    styles: { fontSize: 8, cellPadding: 2.5, halign: 'left' },
    headStyles: { fillColor: [30, 50, 130], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 12 },
      2: { cellWidth: 30 },
      3: { cellWidth: 17, halign: 'center' },
      4: { cellWidth: 45 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'ENTRADA') data.cell.styles.textColor = [22, 163, 74];
        else data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 180);
    doc.text(`Generado el ${new Date().toLocaleString('es-PE')} — El Asesor`, 14, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Pág. ${i} / ${totalPages}`, ancho - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  const nombreArchivo = `cierre_${tipoPeriodo.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
};

// ─── Componente Principal ───────────────────────────────────────────────────
const Cierres = () => {
  const { usuario } = useAuth();
  const [cierres, setCierres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [previsualizado, setPrevisualizado] = useState(null);
  const [cargandoPrev, setCargandoPrev] = useState(false);
  const [cargandoPDF, setCargandoPDF] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    tipo: 'DIARIO',
    saldo_real: '',
    observaciones: '',
  });

  const nombreSede = usuario?.id_sede?.nombre || 'Mi Sede';

  const cargarDatos = useCallback(async () => {
    try {
      const [cierresRes] = await Promise.all([API.get('/cierres')]);
      setCierres(cierresRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarPrevisualizacion = useCallback(async () => {
    setCargandoPrev(true);
    try {
      const { data } = await API.get('/cierres/previsualizar/sede');
      setPrevisualizado(data);
    } catch (err) {
      setPrevisualizado(null);
    } finally {
      setCargandoPrev(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    cargarPrevisualizacion();
  }, [cargarDatos, cargarPrevisualizacion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoForm(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const { data } = await API.post('/cierres', {
        tipo: formData.tipo,
        saldo_real: parseFloat(formData.saldo_real),
        observaciones: formData.observaciones,
      });
      setMensaje({ tipo: 'exito', texto: data.mensaje });
      setFormData({ tipo: 'DIARIO', saldo_real: '', observaciones: '' });
      cargarDatos();
      cargarPrevisualizacion();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'Error al registrar el cierre' });
    } finally {
      setCargandoForm(false);
    }
  };

  const handleGenerarPDF = async (tipoPeriodo) => {
    setCargandoPDF(tipoPeriodo);
    try {
      const hoy = new Date();
      const fechaParam = tipoPeriodo === 'DIARIO'
        ? hoy.toISOString().split('T')[0]
        : `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      const { data } = await API.get(`/cierres/movimientos-periodo?tipo=${tipoPeriodo}&fecha=${fechaParam}`);
      if (!data.movimientos || data.movimientos.length === 0) {
        setMensaje({ tipo: 'error', texto: `No hay movimientos ${tipoPeriodo === 'DIARIO' ? 'de hoy' : 'de este mes'} para generar el PDF.` });
        return;
      }
      generarPDF(data, tipoPeriodo, nombreSede);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al generar el PDF: ' + (err.response?.data?.mensaje || err.message) });
    } finally {
      setCargandoPDF('');
    }
  };

  if (cargando) return <Loader mensaje="Cargando Cierres..." />;

  const diferenciaPrev = previsualizado ? parseFloat(formData.saldo_real || 0) - previsualizado.saldo_esperado : 0;

  return (
    <>
      <main className="min-h-screen" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8 animate-fadeIn flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-8 rounded-full" style={{ background: 'var(--c-accion)' }} />
                <h1 className="text-2xl font-bold" style={{ color: 'var(--c-primario)' }}>
                  Cierre de Sede
                </h1>
              </div>
              <p className="text-sm ml-4" style={{ color: 'var(--c-texto-sub)' }}>
                Sede: <strong style={{ color: 'var(--c-accion)' }}>{nombreSede}</strong> — Agrupa todas las cajas en un solo cierre
              </p>
            </div>

            {/* Botones PDF */}
            <div className="flex gap-3 ml-4 sm:ml-0 flex-wrap">
              <button
                onClick={() => handleGenerarPDF('DIARIO')}
                disabled={!!cargandoPDF}
                className="btn-primario flex items-center gap-2 text-sm py-2 px-4"
                style={{ background: 'var(--c-entrada)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}
              >
                {cargandoPDF === 'DIARIO' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                PDF Hoy
              </button>
              <button
                onClick={() => handleGenerarPDF('MENSUAL')}
                disabled={!!cargandoPDF}
                className="btn-primario flex items-center gap-2 text-sm py-2 px-4"
                style={{ background: 'var(--c-accion)', boxShadow: '0 4px 14px rgba(59,89,218,0.3)' }}
              >
                {cargandoPDF === 'MENSUAL' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                PDF Mes
              </button>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje.texto && (
            <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {mensaje.texto}
              <button className="ml-3 opacity-60 hover:opacity-100" onClick={() => setMensaje({ tipo: '', texto: '' })}>✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-10">

            {/* Panel izquierdo: Previsualizacion + Formulario */}
            <div className="xl:col-span-2 flex flex-col gap-5">

              {/* Pre-visualización de la Sede */}
              <div className="card p-6 animate-fadeIn">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-primario)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Estado Actual de la Sede
                </h2>

                {cargandoPrev ? (
                  <div className="py-6 text-center">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'var(--c-borde)', borderTopColor: 'var(--c-accion)' }} />
                    <p className="text-xs" style={{ color: 'var(--c-texto-sub)' }}>Calculando resumen...</p>
                  </div>
                ) : previsualizado ? (
                  <div className="space-y-3">
                    {/* Stats rápidas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--c-texto-sub)' }}>Total Ingresos</p>
                        <p className="text-sm font-black" style={{ color: 'var(--c-entrada)' }}>+{formatSol(previsualizado.total_ingresos)}</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--c-texto-sub)' }}>Total Egresos</p>
                        <p className="text-sm font-black" style={{ color: 'var(--c-salida)' }}>-{formatSol(previsualizado.total_egresos)}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs p-3 rounded-xl" style={{ background: 'var(--c-fondo)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--c-texto-sub)' }}>Saldo apertura</span>
                        <span className="font-semibold">{formatSol(previsualizado.saldo_apertura)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--c-texto-sub)' }}>Saldo esperado (sistema)</span>
                        <span className="font-black" style={{ color: 'var(--c-accion)' }}>{formatSol(previsualizado.saldo_esperado)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--c-borde)' }}>
                        <span style={{ color: 'var(--c-texto-sub)' }}>Movimientos pendientes</span>
                        <span className="font-bold">{previsualizado.movimientos_pendientes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--c-texto-sub)' }}>Cajas incluidas</span>
                        <span className="font-bold">{previsualizado.cajas_incluidas}</span>
                      </div>
                    </div>

                    {formData.saldo_real && (
                      <div className="flex justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--c-borde)' }}>
                        <span className="text-xs font-bold" style={{ color: 'var(--c-texto)' }}>Diferencia a declarar</span>
                        <span className="text-xs font-black" style={{ color: diferenciaPrev === 0 ? 'var(--c-entrada)' : diferenciaPrev > 0 ? '#F59E0B' : 'var(--c-salida)' }}>
                          {diferenciaPrev > 0 ? '+' : ''}{formatSol(diferenciaPrev)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--c-texto-sub)' }}>No hay movimientos pendientes de cierre.</p>
                )}
              </div>

              {/* Formulario de Cierre */}
              <div className="card p-6 animate-fadeIn">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-primario)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Registrar Cierre
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-texto-sub)' }}>Tipo de Cierre *</label>
                    <select required className="input-field" value={formData.tipo}
                      onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value }))}>
                      <option value="DIARIO">Cierre Diario</option>
                      <option value="MENSUAL">Cierre Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-texto-sub)' }}>Saldo Físico Real (S/) *</label>
                    <input required type="number" step="0.01" min="0" className="input-field"
                      placeholder="Monto contado en físico..."
                      value={formData.saldo_real}
                      onChange={(e) => setFormData((p) => ({ ...p, saldo_real: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-texto-sub)' }}>Observaciones</label>
                    <input type="text" className="input-field" placeholder="Opcional..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData((p) => ({ ...p, observaciones: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={cargandoForm}
                    className="btn-primario w-full py-3 mt-2">
                    {cargandoForm ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" />
                    ) : (
                      `Cerrar ${formData.tipo === 'DIARIO' ? 'Día' : 'Mes'} — ${nombreSede}`
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Historial de Cierres */}
            <div className="xl:col-span-3 card p-6 animate-fadeIn">
              <h2 className="text-base font-bold mb-5" style={{ color: 'var(--c-primario)' }}>
                Historial de Cierres — {nombreSede}
              </h2>

              {cierres.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--c-secundario)' }}>
                    <svg className="w-7 h-7" style={{ color: 'var(--c-texto-sub)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--c-texto-sub)' }}>No hay cierres registrados aún.</p>
                </div>
              ) : (
                <div className="table-wrapper overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase opacity-80">Fecha</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase opacity-80">Sede</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase opacity-80">Tipo</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase opacity-80">Movs.</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase opacity-80">Ingresos</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase opacity-80">Egresos</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase opacity-80">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cierres.map((c) => (
                        <tr key={c._id} className="table-row">
                          <td className="py-3 px-4 text-xs" style={{ color: 'var(--c-texto-sub)' }}>
                            {formatFecha(c.fecha_cierre)}
                          </td>
                          <td className="py-3 px-4 font-medium text-xs">{c.id_sede?.nombre || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`badge ${c.tipo === 'MENSUAL' ? 'badge-aprobado' : 'badge-pendiente'}`}>{c.tipo}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-bold" style={{ color: 'var(--c-accion)' }}>
                            {c.total_movimientos || 0}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs font-bold" style={{ color: 'var(--c-entrada)' }}>
                            +{formatSol(c.total_ingresos)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs font-bold" style={{ color: 'var(--c-salida)' }}>
                            -{formatSol(c.total_egresos)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DiffBadge diferencia={c.diferencia} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
};

export default Cierres;
