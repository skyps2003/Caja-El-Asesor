import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Loader from '../components/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

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
const generarPDF = (datos, tipoPeriodo, nombreSede, imgFondo, fechaSeleccionada) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  const totalPages = () => doc.internal.getNumberOfPages();

  const aplicarFondo = () => {
    if (imgFondo && imgFondo.complete) {
      doc.addImage(imgFondo, 'PNG', 0, 0, ancho, alto, undefined, 'FAST');
    } else {
      // Fallback: Elegante cabecera si no hay imagen
      doc.setFillColor(30, 50, 130);
      doc.rect(0, 0, ancho, 40, 'F');
    }
  };

  // Primera página
  aplicarFondo();

  // Título y Subtítulo (ajustado para no chocar con membrete si es posible)
  // Generalmente los membretes tienen espacio arriba. Si no, bajamos un poco más.
  let y = 45; 
  
  doc.setTextColor(30, 50, 130);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE FINANCIERO', ancho / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 120);
  doc.text(`${tipoPeriodo === 'DIARIO' ? 'Cierre de Caja Diario' : 'Consolidado Mensual de Sede'}`, ancho / 2, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 50, 130);
  doc.text(`SEDE: ${nombreSede.toUpperCase()}`, ancho / 2, y, { align: 'center' });

  // Cuadro de Resumen con estilo Premium
  y += 12;
  const margen = 14;
  const anchoCaja = (ancho - (margen * 2));
  
  doc.setDrawColor(30, 50, 130);
  doc.setLineWidth(0.5);
  doc.line(margen, y, ancho - margen, y);
  
  y += 10;
  doc.setTextColor(80, 80, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN OPERATIVO', margen, y);
  
  y += 6;
  // Fondo suave para el resumen
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(margen, y, anchoCaja, 30, 3, 3, 'F');
  
  // Datos del resumen
  const col1 = margen + 6;
  const col2 = ancho / 2;
  const col3 = ancho - margen - 6;

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text('FECHA DEL REPORTE', col1, y + 8);
  const colRegistrosLabel = ancho - 85;
  doc.text('REGISTROS', colRegistrosLabel, y + 8, { align: 'center' });
  doc.text('SALDO NETO', col3, y + 8, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(30, 50, 130);
  doc.setFont('helvetica', 'bold');
  
  // Lógica de fecha dinámica (Evitando saltos por Zona Horaria)
  let textoFecha = "";
  if (tipoPeriodo === 'DIARIO') {
    // Usamos la fecha seleccionada del input directamente para evitar desfases de zona horaria
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fSeleccionada = new Date(year, month - 1, day);
    textoFecha = fSeleccionada.toLocaleDateString('es-PE', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    }).toUpperCase();
  } else {
    // Rango mensual (usando la fecha de inicio enviada por el backend)
    const hoy = new Date();
    // Ajustamos la fecha de inicio para que no salte al día anterior
    const fInicio = new Date(datos.fecha_inicio);
    fInicio.setMinutes(fInicio.getMinutes() + fInicio.getTimezoneOffset());
    
    const mesNombre = fInicio.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
    const esMesActual = fInicio.getMonth() === hoy.getMonth() && fInicio.getFullYear() === hoy.getFullYear();
    
    if (esMesActual) {
      const hoyStr = hoy.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
      textoFecha = `DEL 01 DE ${mesNombre} AL ${hoyStr}`;
    } else {
      const ultimoDia = new Date(fInicio.getFullYear(), fInicio.getMonth() + 1, 0);
      const ultimoDiaStr = ultimoDia.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
      textoFecha = `DEL 01 DE ${mesNombre} AL ${ultimoDiaStr}`;
    }
  }

  // Ajuste de fuente y posiciones para evitar solapamiento
  const fontSizeFecha = textoFecha.length > 25 ? 8 : 10;
  doc.setFontSize(fontSizeFecha);
  doc.text(textoFecha, col1, y + 16);
  
  doc.setFontSize(9);
  // Movemos la columna central más a la derecha
  const colRegistros = ancho - 85; 
  doc.text(`${datos.total_movimientos} registros`, colRegistros, y + 16, { align: 'center' });
  
  const colorNeto = datos.neto >= 0 ? [22, 163, 74] : [220, 38, 38];
  doc.setTextColor(colorNeto[0], colorNeto[1], colorNeto[2]);
  doc.setFontSize(11);
  doc.text(formatSol(datos.neto), col3, y + 16, { align: 'right' });

  // Desglose de totales
  y += 24;
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);
  doc.text(`(+) INGRESOS: ${formatSol(datos.total_ingresos)}`, col1, y);
  doc.setTextColor(220, 38, 38);
  doc.text(`(-) EGRESOS: ${formatSol(datos.total_egresos)}`, col3, y, { align: 'right' });

  y += 12;

  // Tabla de movimientos
  const filas = datos.movimientos.map((m) => [
    formatFecha(m.fecha_hora),
    m.id_caja?.nombre_caja || '—',
    m.tipo ? 'EGRESO' : 'INGRESO',
    m.concepto || '—',
    formatSol(m.monto),
    formatSol(m.saldo_resultante),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Fecha / Hora', 'Caja / Cuenta', 'Tipo', 'Concepto / Detalle', 'Monto', 'Saldo']],
    body: filas,
    margin: { left: margen, right: margen, bottom: 15 },
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 50, 130], 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 7.5, 
      cellPadding: 3, 
      valign: 'middle' 
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
    didDrawPage: (data) => {
      // Aplicar fondo en páginas nuevas
      if (doc.internal.getNumberOfPages() > 1) {
        // Necesitamos una forma de saber si es una nueva página
        // autoTable lo hace internamente, pero podemos usar hooks
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'INGRESO') data.cell.styles.textColor = [22, 163, 74];
        else data.cell.styles.textColor = [220, 38, 38];
      }
    },
    // Este hook se ejecuta al inicio de cada nueva página creada por autoTable
    beforePageContent: (data) => {
      if (data.pageNumber > 1) {
        aplicarFondo();
      }
    }
  });

  // El footer ha sido removido a petición del usuario.
  const nombreArchivo = `Reporte_${tipoPeriodo}_${nombreSede.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
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
  const [cajas, setCajas] = useState([]);

  const [formData, setFormData] = useState({
    tipo: 'MENSUAL',
    saldo_real: '',
    observaciones: '',
  });

  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().split('T')[0]);

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
    try {
      const { data } = await API.post('/cierres', {
        tipo: formData.tipo,
        saldo_real: parseFloat(formData.saldo_real),
        observaciones: formData.observaciones,
      });
      toast.success(data.mensaje);
      setFormData({ tipo: 'MENSUAL', saldo_real: '', observaciones: '' });
      cargarDatos();
      cargarPrevisualizacion();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar el cierre');
    } finally {
      setCargandoForm(false);
    }
  };

  const handleGenerarPDF = async (tipoPeriodo) => {
    setCargandoPDF(tipoPeriodo);
    try {
      const fechaParam = tipoPeriodo === 'DIARIO' ? fechaReporte : fechaReporte.substring(0, 7);

      // Cargar la hoja membretada
      const img = new Image();
      img.src = '/Papel mebretado.png';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          console.error("No se pudo cargar el membrete.");
          resolve();
        };
      });

      const { data } = await API.get(`/cierres/movimientos-periodo?tipo=${tipoPeriodo}&fecha=${fechaParam}`);
      if (!data.movimientos || data.movimientos.length === 0) {
        toast.error(`No hay movimientos para la fecha ${fechaParam} para generar el PDF.`);
        return;
      }
      generarPDF(data, tipoPeriodo, nombreSede, img, fechaReporte);
    } catch (err) {
      toast.error('Error al generar el PDF: ' + (err.response?.data?.mensaje || err.message));
    } finally {
      setCargandoPDF('');
    }
  };

  const handleExportExcel = async () => {
    if (cajas.length === 0) {
      toast.error('No se encontraron cajas vinculadas a esta sede para generar el reporte.');
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
      toast.error('Error al generar el reporte Excel consolidado.');
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
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-fadeIn">
            <div className="space-y-1">
              <h1 className="text-4xl font-heading font-black text-[var(--c-primario)]">Consolidación de Sede</h1>
              <p className="text-[var(--c-texto-sub)] font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--c-accion)] rounded-full"></span>
                Operaciones Centralizadas — <span className="text-[var(--c-primario)] font-black">{nombreSede}</span>
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--c-texto-sub)] uppercase tracking-widest ml-1">Fecha de Consulta</label>
                <input 
                  type="date" 
                  value={fechaReporte} 
                  onChange={(e) => setFechaReporte(e.target.value)}
                  className="premium-input !py-2 !px-4 !text-xs !bg-[var(--c-fondo-card)] border-[var(--c-borde)] hover:border-[var(--c-accion)] transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerarPDF('DIARIO')}
                  disabled={!!cargandoPDF}
                  className="btn-gold !bg-[var(--c-fondo-card)] !text-[var(--c-primario)] !border-[var(--c-borde)] hover:!border-[var(--c-accion)] !px-4"
                  title="Generar PDF del día seleccionado"
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
                  className="btn-gold !bg-[var(--c-fondo-card)] !text-[var(--c-primario)] !border-[var(--c-borde)] hover:!border-[var(--c-accion)] !px-4"
                  title="Generar PDF del mes seleccionado"
                >
                  {cargandoPDF === 'MENSUAL' ? (
                    <span className="w-4 h-4 border-2 border-[var(--c-primario)]/20 border-t-[var(--c-primario)] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                  PDF Mensual
                </button>

                <button
                  onClick={handleExportExcel}
                  disabled={exportandoExcel || cajas.length === 0}
                  className="btn-gold !px-4"
                  title="Exportar consolidado de toda la sede en Excel"
                >
                  {exportandoExcel ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                  Excel Mensual
                </button>
              </div>
            </div>
          </div>

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

                <div className="mb-6 p-4 bg-[var(--c-accion-pastel)] rounded-xl border border-[var(--c-accion)]/20 flex items-start gap-3">
                  <svg className="w-5 h-5 text-[var(--c-accion)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] font-bold text-[var(--c-primario)] leading-relaxed">
                    <span className="uppercase block mb-1">Cierre Automático Activo</span>
                    El sistema ejecuta el cierre <span className="text-[var(--c-accion)]">DIARIO</span> de forma automática a las <span className="font-black">23:59</span> cada noche. Solo debe realizar cierres manuales para auditorías mensuales.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <input type="hidden" name="tipo" value={formData.tipo} />
                  <div>
                    <label className="block text-[10px] font-black text-[var(--c-texto-sub)] uppercase tracking-widest mb-2 ml-1">Efectivo en Bóveda (S/)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--c-texto-sub)]">S/</span>
                      <input required type="number" step="0.01" min="0" className="premium-input !pl-10 !bg-[var(--c-secundario)]"
                        placeholder="0.00"
                        value={formData.saldo_real}
                        onChange={(e) => setFormData((p) => ({ ...p, saldo_real: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[var(--c-texto-sub)] uppercase tracking-widest mb-2 ml-1">Notas de Auditoría</label>
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
