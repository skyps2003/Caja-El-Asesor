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
  if (v === 0) return <span className="badge badge-success">CUADRADO</span>;
  if (v > 0) return <span className="badge badge-warning">+{formatSol(v)}</span>;
  return <span className="badge badge-danger">{formatSol(v)}</span>;
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
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cajas, setCajas] = useState([]);

  const [formData, setFormData] = useState({
    tipo: 'DIARIO',
    saldo_real: '',
    observaciones: '',
  });

  const nombreSede = usuario?.id_sede?.nombre || 'Mi Sede';

  const cargarDatos = useCallback(async () => {
    try {
      let idSede = usuario.id_sede?._id || usuario.id_sede;
      if (!idSede) {
        const sedesRes = await API.get('/sedes');
        if (sedesRes.data && sedesRes.data.length > 0) {
          idSede = sedesRes.data[0]._id;
        }
      }

      const [cierresRes, cajasRes] = await Promise.all([
        API.get('/cierres'),
        API.get(`/cajas/sede/${idSede}`)
      ]);
      setCierres(cierresRes.data);
      setCajas(cajasRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

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
  }, [usuario]);

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
      const anio = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      const fechaParam = tipoPeriodo === 'DIARIO' ? `${anio}-${mes}-${dia}` : `${anio}-${mes}`;

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

  const handleExportExcel = async () => {
    if (cajas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No se encontraron cajas vinculadas a esta sede para generar el reporte.' });
      return;
    }

    setExportandoExcel(true);
    try {
      const hoy = new Date();
      // Usamos el ID de la primera caja de la sede; el backend generará el reporte para toda la sede vinculada.
      const id_caja = cajas[0]._id;
      
      const res = await API.post('/reportes/mensual', {
        id_caja,
        mes: hoy.getMonth() + 1,
        anio: hoy.getFullYear()
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Consolidado_Sede_${nombreSede.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      setMensaje({ tipo: 'error', texto: 'Error al generar el reporte Excel consolidado.' });
    } finally {
      setExportandoExcel(false);
    }
  };

  if (cargando) return <Loader mensaje="Cargando Cierres..." />;

  const diferenciaPrev = previsualizado ? parseFloat(formData.saldo_real || 0) - previsualizado.saldo_esperado : 0;

  return (
    <>
      <main className="min-h-screen" style={{ background: 'var(--c-fondo)' }}>
        <div className="max-w-7xl mx-auto px-4 py-10">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-heading font-bold text-[var(--c-primario)]">Consolidación de Sede</h1>
              <p className="text-[var(--c-texto-sub)] font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--c-accion)] rounded-full"></span>
                Operaciones Centralizadas — <span className="text-[var(--c-primario)] font-bold">{nombreSede}</span>
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleGenerarPDF('DIARIO')}
                disabled={!!cargandoPDF}
                className="btn-gold !bg-[var(--c-fondo-card)] !text-[var(--c-primario)] !border-[var(--c-borde)] hover:!border-[var(--c-accion)]"
              >
                {cargandoPDF === 'DIARIO' ? (
                  <span className="w-4 h-4 border-2 border-[var(--c-primario)]/20 border-t-[var(--c-primario)] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                Reporte Diario
              </button>
              <button
                onClick={() => handleGenerarPDF('MENSUAL')}
                disabled={!!cargandoPDF}
                className="btn-gold !bg-[var(--c-fondo-card)] !text-[var(--c-primario)] !border-[var(--c-borde)] hover:!border-[var(--c-accion)]"
              >
                {cargandoPDF === 'MENSUAL' ? (
                  <span className="w-4 h-4 border-2 border-[var(--c-primario)]/20 border-t-[var(--c-primario)] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                Balance Mensual (PDF)
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exportandoExcel || cajas.length === 0}
                className="btn-gold"
              >
                {exportandoExcel ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                Reporte Mensual (Excel)
              </button>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje.texto && (
            <div className={`mb-10 p-5 rounded-2xl flex items-center gap-4 animate-slideIn ${
              mensaje.tipo === 'exito' ? 'bg-[var(--c-success-pastel)] border border-green-100 text-green-800' : 'bg-[var(--c-danger-pastel)] border border-red-100 text-red-800'
            }`}>
              <div className={`p-2.5 rounded-xl ${mensaje.tipo === 'exito' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {mensaje.tipo === 'exito' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest mb-0.5">{mensaje.tipo === 'exito' ? 'Proceso Completado' : 'Notificación de Error'}</p>
                <p className="text-sm font-medium opacity-90">{mensaje.texto}</p>
              </div>
              <button onClick={() => setMensaje({ tipo: '', texto: '' })} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-10">

            {/* Panel izquierdo: Previsualizacion + Formulario */}
            <div className="xl:col-span-2 flex flex-col gap-8">

              {/* Pre-visualización de la Sede */}
              <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--c-primario)]">Proyección de Cierre</h2>
                  <span className="px-2 py-1 bg-[var(--c-accion-pastel)] text-[var(--c-accion)] text-[9px] font-bold rounded-md">TIEMPO REAL</span>
                </div>

                {cargandoPrev ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <div className="w-10 h-10 border-2 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--c-borde)', borderTopColor: 'var(--c-accion)' }} />
                    <p className="text-xs font-bold text-[var(--c-texto-sub)] uppercase tracking-widest">Calculando balances...</p>
                  </div>
                ) : previsualizado ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-[var(--c-secundario)] rounded-2xl border border-[var(--c-borde)]">
                        <p className="text-[10px] font-bold text-[var(--c-texto-sub)] uppercase mb-2">Ingresos Consolidados</p>
                        <p className="text-lg font-black text-[var(--c-entrada)]">+{formatSol(previsualizado.total_ingresos)}</p>
                      </div>
                      <div className="p-5 bg-[var(--c-secundario)] rounded-2xl border border-[var(--c-borde)]">
                        <p className="text-[10px] font-bold text-[var(--c-texto-sub)] uppercase mb-2">Egresos Consolidados</p>
                        <p className="text-lg font-black text-[var(--c-salida)]">-{formatSol(previsualizado.total_egresos)}</p>
                      </div>
                    </div>

                    <div className="p-6 bg-[var(--c-primario)] rounded-2xl shadow-xl shadow-[var(--c-primario)]/10 text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                       <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Saldo Esperado en Sistema</p>
                       <p className="relative z-10 text-3xl font-black font-heading tracking-tight">{formatSol(previsualizado.saldo_esperado)}</p>
                    </div>

                    <div className="space-y-3 px-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[var(--c-texto-sub)]">Saldo de Apertura</span>
                        <span className="text-[var(--c-primario)] font-bold">{formatSol(previsualizado.saldo_apertura)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[var(--c-texto-sub)]">Movimientos Auditados</span>
                        <span className="text-[var(--c-primario)] font-bold">{previsualizado.movimientos_pendientes} registros</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[var(--c-texto-sub)]">Cajas Incluidas</span>
                        <span className="text-[var(--c-primario)] font-bold">{previsualizado.cajas_incluidas} unidades</span>
                      </div>
                    </div>

                    {formData.saldo_real && (
                      <div className="pt-4 border-t border-[var(--c-borde)]">
                         <div className={`p-4 rounded-xl flex items-center justify-between ${diferenciaPrev === 0 ? 'bg-[var(--c-success-pastel)]' : 'bg-[var(--c-danger-pastel)]'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Desviación de Caja</span>
                            <span className="text-sm font-black tracking-tight">
                              {diferenciaPrev > 0 ? '+' : ''}{formatSol(diferenciaPrev)}
                            </span>
                         </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-40">
                    <p className="text-sm font-bold uppercase tracking-widest">Sin actividad pendiente</p>
                  </div>
                )}
              </div>

              {/* Formulario de Cierre */}
              <div className="bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1.5 h-6 bg-[var(--c-accion)] rounded-full"></div>
                   <h2 className="text-sm font-black uppercase tracking-widest text-[var(--c-primario)]">Protocolo de Cierre</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-wider mb-2 ml-1">Frecuencia del Cierre</label>
                    <div className="flex bg-[var(--c-secundario)] p-1 rounded-xl border border-[var(--c-borde)]">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, tipo: 'DIARIO' }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.tipo === 'DIARIO' ? 'bg-[var(--c-fondo-card)] shadow-sm text-[var(--c-primario)]' : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)]'}`}
                      >
                        DIARIO
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, tipo: 'MENSUAL' }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.tipo === 'MENSUAL' ? 'bg-[var(--c-fondo-card)] shadow-sm text-[var(--c-primario)]' : 'text-[var(--c-texto-sub)] hover:text-[var(--c-primario)]'}`}
                      >
                        MENSUAL
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-wider mb-2 ml-1">Efectivo en Bóveda (S/)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--c-texto-sub)]">S/</span>
                      <input required type="number" step="0.01" min="0" className="premium-input !pl-10 !bg-[var(--c-secundario)]"
                        placeholder="0.00"
                        value={formData.saldo_real}
                        onChange={(e) => setFormData((p) => ({ ...p, saldo_real: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-wider mb-2 ml-1">Notas de Auditoría</label>
                    <textarea className="premium-input !bg-[var(--c-secundario)] resize-none" rows={2} placeholder="Describa cualquier discrepancia o novedad..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData((p) => ({ ...p, observaciones: e.target.value }))} />
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={cargandoForm} className="btn-gold !w-full !py-4 shadow-xl">
                      {cargandoForm ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        `EJECUTAR CIERRE ${formData.tipo}`
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Historial de Cierres */}
            <div className="xl:col-span-3 bg-[var(--c-fondo-card)] rounded-[24px] p-8 border border-[var(--c-borde)] shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-sm font-black uppercase tracking-widest text-[var(--c-primario)]">Registro Histórico</h2>
                 <div className="w-12 h-1 bg-[var(--c-accion-pastel)] rounded-full"></div>
              </div>

              {cierres.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-[var(--c-secundario)] rounded-3xl mx-auto mb-4 flex items-center justify-center border border-[var(--c-borde)]">
                    <svg className="w-8 h-8 text-[var(--c-texto-sub)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--c-texto-sub)]">No se encontraron cierres</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-4">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Fecha de Cierre</th>
                        <th>Tipo</th>
                        <th className="text-center">Ops.</th>
                        <th className="text-right">Balance</th>
                        <th className="text-right">Auditado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cierres.map((c) => (
                        <tr key={c._id}>
                          <td className="text-[11px] font-bold text-[var(--c-texto-sub)]">
                            {formatFecha(c.fecha_cierre)}
                          </td>
                          <td>
                            <span className={`badge ${c.tipo === 'MENSUAL' ? 'badge-warning' : 'badge-success'}`}>
                               {c.tipo}
                            </span>
                          </td>
                          <td className="text-center font-black text-xs text-[var(--c-primario)]">
                            {c.total_movimientos || 0}
                          </td>
                          <td className="text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-[var(--c-entrada)]">+{formatSol(c.total_ingresos)}</span>
                                <span className="text-[11px] font-black text-[var(--c-salida)]">-{formatSol(c.total_egresos)}</span>
                             </div>
                          </td>
                          <td className="text-right">
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
