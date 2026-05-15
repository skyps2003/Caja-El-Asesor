import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatSol = (n = 0) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
const formatFecha = (f) => new Date(f).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const generarPDF = (datos, tipoPeriodo, nombreSede, imgFondo, fechaSeleccionada, incluirSede = false) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  const aplicarFondo = () => {
    if (imgFondo && imgFondo.complete) {
      doc.addImage(imgFondo, 'PNG', 0, 0, ancho, alto, undefined, 'FAST');
    } else {
      doc.setFillColor(30, 50, 130);
      doc.rect(0, 0, ancho, 40, 'F');
    }
  };

  aplicarFondo();

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
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(margen, y, anchoCaja, 30, 3, 3, 'F');
  
  const col1 = margen + 6;
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
  
  let textoFecha = "";
  if (tipoPeriodo === 'DIARIO') {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fSeleccionada = new Date(year, month - 1, day);
    textoFecha = fSeleccionada.toLocaleDateString('es-PE', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    }).toUpperCase();
  } else {
    const fInicio = new Date(datos.fecha_inicio);
    fInicio.setMinutes(fInicio.getMinutes() + fInicio.getTimezoneOffset());
    const mesNombre = fInicio.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
    const ultimoDia = new Date(fInicio.getFullYear(), fInicio.getMonth() + 1, 0);
    const ultimoDiaStr = ultimoDia.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    textoFecha = `DEL 01 DE ${mesNombre} AL ${ultimoDiaStr}`;
  }

  const fontSizeFecha = textoFecha.length > 25 ? 8 : 10;
  doc.setFontSize(fontSizeFecha);
  doc.text(textoFecha, col1, y + 16);
  
  doc.setFontSize(9);
  const colRegistros = ancho - 85; 
  doc.text(`${datos.total_movimientos} registros`, colRegistros, y + 16, { align: 'center' });
  
  const colorNeto = datos.neto >= 0 ? [22, 163, 74] : [220, 38, 38];
  doc.setTextColor(colorNeto[0], colorNeto[1], colorNeto[2]);
  doc.setFontSize(11);
  doc.text(formatSol(datos.neto), col3, y + 16, { align: 'right' });

  y += 24;
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);
  doc.text(`(+) INGRESOS: ${formatSol(datos.total_ingresos)}`, col1, y);
  doc.setTextColor(220, 38, 38);
  doc.text(`(-) EGRESOS: ${formatSol(datos.total_egresos)}`, col3, y, { align: 'right' });

  y += 12;

  const cabeceras = ['Fecha / Hora'];
  if (incluirSede) cabeceras.push('Sede');
  cabeceras.push('Caja / Cuenta', 'Tipo', 'Concepto / Detalle', 'Monto', 'Saldo');

  const filas = datos.movimientos.map((m) => {
    const fila = [formatFecha(m.fecha_hora)];
    if (incluirSede) fila.push(m.id_caja?.id_sede?.nombre || '—');
    fila.push(
      m.id_caja?.nombre_caja || '—',
      m.tipo ? 'EGRESO' : 'INGRESO',
      m.concepto || '—',
      formatSol(m.monto),
      formatSol(m.saldo_resultante)
    );
    return fila;
  });

  autoTable(doc, {
    startY: y,
    head: [cabeceras],
    body: filas,
    margin: { left: margen, right: margen, bottom: 15 },
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 50, 130], 
      textColor: [255, 255, 255], 
      fontSize: incluirSede ? 7 : 8, 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: incluirSede ? 7 : 7.5, cellPadding: incluirSede ? 2 : 3, valign: 'middle' },
    columnStyles: incluirSede ? {
      0: { cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 26 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
    } : {
      0: { cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
    didParseCell: (data) => {
      const idxTipo = incluirSede ? 3 : 2;
      if (data.section === 'body' && data.column.index === idxTipo) {
        if (data.cell.raw === 'INGRESO') data.cell.styles.textColor = [22, 163, 74];
        else data.cell.styles.textColor = [220, 38, 38];
      }
    },
    beforePageContent: (data) => {
      if (data.pageNumber > 1) {
        aplicarFondo();
      }
    }
  });

  const nombreArchivo = `Reporte_${tipoPeriodo}_${nombreSede.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
};

const Documentos = () => {
  const { usuario } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [filtros, setFiltros] = useState({
    tipoReporte: 'mensual',
    fecha: new Date().toISOString().split('T')[0],
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  });

  useEffect(() => {
    const cargarSedes = async () => {
      try {
        const res = await API.get('/sedes');
        setSedes(res.data);
      } catch (error) {
        toast.error('Error al cargar sedes');
      }
    };
    cargarSedes();
  }, []);

  const descargarPorSede = async (sedeId, formato, sedeNombre) => {
    setCargando(true);
    try {
      if (formato === 'pdf') {
        const tipoPeriodo = filtros.tipoReporte.toUpperCase();
        const fechaParam = filtros.tipoReporte === 'diario' ? filtros.fecha : `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}`;
        const img = new Image();
        img.src = '/Papel mebretado.png';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = () => { console.error("No se pudo cargar el membrete."); resolve(); };
        });

        const { data } = await API.get(`/cierres/movimientos-periodo?tipo=${tipoPeriodo}&fecha=${fechaParam}&sedeId=${sedeId}`);
        if (!data.movimientos || data.movimientos.length === 0) {
          toast.error(`No hay movimientos para generar el PDF.`);
          return;
        }
        generarPDF(data, tipoPeriodo, sedeNombre, img, filtros.fecha, true);
      } else {
        const endpoint = filtros.tipoReporte === 'diario' ? '/reportes/diario' : '/reportes/mensual';
        const payload = {
          tipo: filtros.tipoReporte,
          formato: 'excel',
          id_caja: 'todas',
          sedeId: sedeId,
        };
        if (filtros.tipoReporte === 'diario') payload.fecha = filtros.fecha;
        else { payload.mes = filtros.mes; payload.anio = filtros.anio; }

        const res = await API.post(endpoint, payload, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Reporte_${filtros.tipoReporte}_${sedeNombre.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      toast.success(`Reporte de ${sedeNombre} generado`);
    } catch (error) {
      toast.error('Error al generar el reporte');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo animate-fade-in p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Panel de Filtros */}
          <div className="lg:w-1/3">
            <div className="premium-card sticky top-10">
              <h2 className="text-xl font-heading text-primario mb-6 flex items-center gap-3">
                <span className="p-2 bg-[var(--c-accion)]/10 text-[var(--c-accion)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </span>
                Parámetros de Reporte
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-primario uppercase tracking-[0.2em] mb-3 ml-1">Tipo de Reporte</label>
                  <div className="flex bg-[var(--c-secundario)] p-1 rounded-xl border border-[var(--c-borde)]">
                    {['mensual', 'diario'].map(t => (
                      <button
                        key={t}
                        onClick={() => setFiltros(p => ({ ...p, tipoReporte: t }))}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${filtros.tipoReporte === t ? 'bg-white shadow-sm text-[var(--c-accion)]' : 'text-[var(--c-texto-sub)] uppercase'}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {filtros.tipoReporte === 'diario' ? (
                  <div className="space-y-2 animate-slide-up">
                    <label className="block text-[10px] font-black text-primario uppercase tracking-[0.2em] ml-1">Seleccionar Fecha</label>
                    <input
                      type="date"
                      value={filtros.fecha}
                      onChange={(e) => setFiltros(p => ({ ...p, fecha: e.target.value }))}
                      className="premium-input !bg-[var(--c-fondo-card)] font-bold text-xs"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 animate-slide-up">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-primario uppercase tracking-[0.2em] ml-1">Mes</label>
                      <select
                        value={filtros.mes}
                        onChange={(e) => setFiltros(p => ({ ...p, mes: e.target.value }))}
                        className="premium-input !bg-[var(--c-fondo-card)] font-bold text-xs"
                      >
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-primario uppercase tracking-[0.2em] ml-1">Año</label>
                      <select
                        value={filtros.anio}
                        onChange={(e) => setFiltros(p => ({ ...p, anio: e.target.value }))}
                        className="premium-input !bg-[var(--c-fondo-card)] font-bold text-xs"
                      >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-[var(--c-borde)]">
                  <button
                    onClick={() => descargarPorSede('todas', 'pdf', 'Consolidado Global')}
                    className="btn-gold !w-full !py-4 flex items-center justify-center gap-3"
                    disabled={cargando}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descarga Consolidada (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Listado de Sedes */}
          <div className="lg:w-2/3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-[var(--c-accion)] rounded-full" />
              <h2 className="text-2xl font-heading font-bold text-primario">Reportes por Sede</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sedes.map(sede => (
                <div key={sede._id} className="premium-card hover:border-[var(--c-accion)]/30 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-black text-primario uppercase tracking-tight">{sede.nombre}</h3>
                      <p className="text-[10px] text-[var(--c-texto-sub)] font-bold tracking-widest">{sede.codigo}</p>
                    </div>
                    <div className="p-3 bg-[var(--c-secundario)] rounded-2xl group-hover:bg-[var(--c-accion)]/5 transition-colors">
                      <svg className="w-6 h-6 text-[var(--c-accion)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => descargarPorSede(sede._id, 'pdf', sede.nombre)}
                      className="flex items-center justify-between p-4 bg-[var(--c-secundario)] rounded-2xl hover:bg-[var(--c-accion)]/10 transition-all border border-[var(--c-borde)] group/btn"
                      disabled={cargando}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover/btn:bg-red-200 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-black text-primario uppercase tracking-wider">Reporte PDF</span>
                      </div>
                      <svg className="w-4 h-4 text-[var(--c-texto-sub)] group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <button
                      onClick={() => descargarPorSede(sede._id, 'excel', sede.nombre)}
                      className="flex items-center justify-between p-4 bg-[var(--c-secundario)] rounded-2xl hover:bg-emerald-50 transition-all border border-[var(--c-borde)] group/btn"
                      disabled={cargando}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover/btn:bg-emerald-200 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-black text-primario uppercase tracking-wider">Reporte Excel</span>
                      </div>
                      <svg className="w-4 h-4 text-[var(--c-texto-sub)] group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentos;
