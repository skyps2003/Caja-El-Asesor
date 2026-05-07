const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Movimiento = require('../models/Movimiento');
const PeriodoMensual = require('../models/PeriodoMensual');
const Caja = require('../models/Caja');

// ── Generar reporte mensual en Excel ─────────────────────────
const generarReporteMensual = async (req, res) => {
  try {
    const { id_caja, mes, anio } = req.body;

    if (!id_caja || !mes || !anio) {
      return res.status(400).json({ mensaje: 'Debe proporcionar id_caja, mes y anio' });
    }

    const cajaActual = await Caja.findById(id_caja).populate('id_sede');
    if (!cajaActual) return res.status(404).json({ mensaje: 'Caja no encontrada' });

    // Obtener todas las cajas de la sede para el listado superior
    const todasLasCajas = await Caja.find({ id_sede: cajaActual.id_sede._id }).sort({ codigo: 1 });

    // Obtener movimientos de todas las cajas de la sede en ese mes (el reporte parece ser por sede)
    // O tal vez solo de la caja actual? El screenshot muestra varios códigos (001, 002, 003, 005).
    // Así que fetch de todas las cajas de la sede.
    const IDsCajas = todasLasCajas.map(c => c._id);
    
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

    const movimientos = await Movimiento.find({
      id_caja: { $in: IDsCajas },
      fecha_hora: { $gte: fechaInicio, $lte: fechaFin }
    }).sort({ fecha_hora: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Diario');

    // --- ESTILOS ---
    const borderFull = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    const fillHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } }; // Amarillo suave
    const fillGreen = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }; // Verde suave
    const fillBlue = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }; // Azul suave
    
    // 1. Listado de Tipos de Caja (A3:C8)
    worksheet.mergeCells('A3:B3');
    worksheet.getCell('A3').value = 'Liste los Tipos de Caja';
    worksheet.getCell('A3').font = { italic: true, color: { argb: 'FFCC7A00' } };

    worksheet.getCell('A4').value = 'Nro.';
    worksheet.getCell('B4').value = 'Tipo de Caja';
    worksheet.getCell('A4').fill = fillHeader;
    worksheet.getCell('B4').fill = fillHeader;
    worksheet.getCell('A4').border = borderFull;
    worksheet.getCell('B4').border = borderFull;

    todasLasCajas.forEach((c, i) => {
      const row = 5 + i;
      worksheet.getCell(`A${row}`).value = c.codigo;
      worksheet.getCell(`B${row}`).value = c.nombre_caja;
      worksheet.getCell(`A${row}`).border = borderFull;
      worksheet.getCell(`B${row}`).border = borderFull;
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    });

    // 2. Saldos a mantener (E3:H6)
    worksheet.mergeCells('E3:H3');
    worksheet.getCell('E3').value = 'Ingrese los saldos a mantener en caja';
    worksheet.getCell('E3').font = { italic: true, color: { argb: 'FFCC7A00' } };
    worksheet.getCell('E3').alignment = { horizontal: 'center' };

    worksheet.getCell('G4').value = 'Mínimo:';
    worksheet.getCell('H4').value = 500;
    worksheet.getCell('H4').numFmt = '"S/ " #,##0.00';
    worksheet.getCell('G5').value = 'Máximo:';
    worksheet.getCell('H5').value = 10000;
    worksheet.getCell('H5').numFmt = '"S/ " #,##0.00';
    
    worksheet.getCell('G4').fill = fillHeader;
    worksheet.getCell('H4').fill = fillHeader;
    worksheet.getCell('G5').fill = fillHeader;
    worksheet.getCell('H5').fill = fillHeader;
    worksheet.getCell('G4').font = { color: { argb: 'FF38761D' }, bold: true };
    worksheet.getCell('G5').font = { color: { argb: 'FF38761D' }, bold: true };

    // 3. Saldo Total y Mensaje (L4:M6)
    const saldoTotalSede = todasLasCajas.reduce((acc, curr) => acc + curr.saldo_actual, 0);
    worksheet.mergeCells('L4:N4');
    worksheet.getCell('L4').value = `SALDO TOTAL DE CAJA        S/ ${saldoTotalSede.toFixed(2)}`;
    worksheet.getCell('L4').alignment = { horizontal: 'center' };
    worksheet.getCell('L4').border = { bottom: { style: 'thin', color: { argb: 'FFFF0000' } }, top: { style: 'thin', color: { argb: 'FFFF0000' } }, left: { style: 'thin', color: { argb: 'FFFF0000' } }, right: { style: 'thin', color: { argb: 'FFFF0000' } } };
    worksheet.getCell('L4').font = { bold: true, color: { argb: 'FF38761D' } };

    if (saldoTotalSede < 500) {
      worksheet.mergeCells('L5:N5');
      worksheet.getCell('L5').value = `La caja es inferior a su mínimo tolerable en un monto equivalente a ${500 - saldoTotalSede}`;
      worksheet.getCell('L5').font = { italic: true, size: 10 };
      worksheet.getCell('L5').alignment = { horizontal: 'center' };
    }

    // 4. Tabla de Movimientos (A12...)
    worksheet.mergeCells('A12:D12');
    worksheet.getCell('A12').value = 'Ingrese los movimientos de caja diarios';
    worksheet.getCell('A12').font = { italic: true, color: { argb: 'FFCC7A00' } };

    const headers = ['FECHA', 'CONCEPTO', 'CÓDIGO', 'N° RECIBO', 'ENTRADAS', 'SALIDAS', 'SALDO'];
    headers.forEach((h, i) => {
      const cell = worksheet.getCell(13, i + 1);
      cell.value = h;
      cell.fill = fillHeader;
      cell.border = borderFull;
      cell.font = { bold: true, color: { argb: 'FF38761D' } };
      cell.alignment = { horizontal: 'center' };
    });

    let currentRow = 14;
    let saldoAcumulado = 0; // O tal vez el saldo inicial del periodo?
    
    movimientos.forEach((mov) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(mov.fecha_hora).toLocaleDateString('es-PE');
      
      let desc = mov.descripcion || 'Sin descripción';
      if (mov.tipo_comprobante === 'FACTURA') {
        desc += ` (RUC: ${mov.ruc || '—'} - ${mov.razon_social || '—'})`;
      }
      worksheet.getCell(`B${currentRow}`).value = desc;

      const c = todasLasCajas.find(c => c._id.toString() === mov.id_caja.toString());
      worksheet.getCell(`C${currentRow}`).value = c ? c.codigo : '—';
      
      const compPrefix = mov.tipo_comprobante === 'FACTURA' ? 'FAC' : mov.tipo_comprobante === 'RECIBO' ? 'REC' : '';
      worksheet.getCell(`D${currentRow}`).value = compPrefix ? `${compPrefix}: ${mov.codigo_comprobante}` : 'S/C';
      
      if (mov.tipo === false || mov.tipo === 0) {
        worksheet.getCell(`E${currentRow}`).value = mov.monto;
        worksheet.getCell(`E${currentRow}`).numFmt = '"S/ " #,##0.00';
      } else {
        worksheet.getCell(`F${currentRow}`).value = mov.monto;
        worksheet.getCell(`F${currentRow}`).numFmt = '"S/ " #,##0.00';
      }

      worksheet.getCell(`G${currentRow}`).value = mov.saldo_actual;
      worksheet.getCell(`G${currentRow}`).numFmt = '"S/ " #,##0.00';
      worksheet.getCell(`G${currentRow}`).fill = fillGreen;
      
      // Bordes punteados para el cuerpo
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        worksheet.getCell(`${col}${currentRow}`).border = {
          left: { style: 'dotted' }, right: { style: 'dotted' }, bottom: { style: 'dotted' }
        };
      });

      currentRow++;
    });

    // 5. Tabla resumen por tipo (L7...)
    let resRow = 7;
    worksheet.getCell(`M${resRow}`).value = 'TIPO DE CAJA';
    worksheet.getCell(`N${resRow}`).value = 'SALDO';
    worksheet.getCell(`M${resRow}`).fill = fillHeader;
    worksheet.getCell(`N${resRow}`).fill = fillHeader;
    worksheet.getCell(`M${resRow}`).font = { bold: true, color: { argb: 'FF38761D' } };
    worksheet.getCell(`N${resRow}`).font = { bold: true, color: { argb: 'FF38761D' } };
    resRow++;

    todasLasCajas.forEach(c => {
      worksheet.getCell(`M${resRow}`).value = `Saldo en ${c.nombre_caja}`;
      worksheet.getCell(`N${resRow}`).value = c.saldo_actual;
      worksheet.getCell(`N${resRow}`).numFmt = '"S/ " #,##0.00';
      worksheet.getCell(`M${resRow}`).fill = fillBlue;
      worksheet.getCell(`N${resRow}`).fill = fillBlue;
      resRow++;
    });

    // Ajustar anchos
    worksheet.getColumn('A').width = 12;
    worksheet.getColumn('B').width = 30;
    worksheet.getColumn('C').width = 10;
    worksheet.getColumn('D').width = 15;
    worksheet.getColumn('E').width = 15;
    worksheet.getColumn('F').width = 15;
    worksheet.getColumn('G').width = 15;
    worksheet.getColumn('M').width = 25;
    worksheet.getColumn('N').width = 15;

    // Generar archivo
    const fileName = `Reporte_Caja_Premium_${mes}_${anio}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);
    if (!fs.existsSync(path.join(__dirname, '../temp'))) fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error(err);
      fs.unlink(filePath, () => {});
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar Excel', error: error.message });
  }
};

// ── Generar reporte general de caja (todos los períodos) ──────
const generarReporteGeneral = async (req, res) => {
  try {
    const { id_caja } = req.body;

    if (!id_caja) {
      return res.status(400).json({ mensaje: 'Debe proporcionar id_caja' });
    }

    // Obtener caja
    const caja = await Caja.findById(id_caja);
    if (!caja) {
      return res.status(404).json({ mensaje: 'Caja no encontrada' });
    }

    // Obtener todos los períodos de la caja
    const periodos = await PeriodoMensual.find({ id_caja })
      .populate('id_usuario_cierre', 'login_usuario')
      .sort({ anio: 1, mes: 1 });

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumen General');

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF667EEA' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const titleStyle = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' },
    };

    const numberFormat = '#,##0.00';

    // Título
    worksheet.merge('A1:G1');
    worksheet.getCell('A1').value = `📊 RESUMEN GENERAL - ${caja.nombre_caja}`;
    worksheet.getCell('A1').style = titleStyle;
    worksheet.row(1).height = 25;

    // Headers
    const headers = [
      'Mes/Año',
      'Saldo Inicial',
      'Ingresos',
      'Egresos',
      'Saldo Final Esperado',
      'Saldo Final Real',
      'Diferencia',
    ];

    headers.forEach((header, colIndex) => {
      const cell = worksheet.getCell(3, colIndex + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // Datos
    let rowNum = 4;
    periodos.forEach((periodo) => {
      const mesAnio = `${periodo.mes}/${periodo.anio}`;
      const esperado =
        periodo.saldo_inicial +
        (periodo.total_ingresos || 0) -
        (periodo.total_egresos || 0);
      const diferencia = (periodo.saldo_final || 0) - esperado;

      worksheet.getCell(`A${rowNum}`).value = mesAnio;
      worksheet.getCell(`B${rowNum}`).value = periodo.saldo_inicial;
      worksheet.getCell(`C${rowNum}`).value = periodo.total_ingresos || 0;
      worksheet.getCell(`D${rowNum}`).value = periodo.total_egresos || 0;
      worksheet.getCell(`E${rowNum}`).value = esperado;
      worksheet.getCell(`F${rowNum}`).value = periodo.saldo_final || 'No cerrado';
      worksheet.getCell(`G${rowNum}`).value = diferencia;

      for (let col = 1; col <= 7; col++) {
        const cell = worksheet.getCell(rowNum, col);
        if (col > 1) {
          cell.numFmt = numberFormat;
        }
      }

      rowNum++;
    });

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
    ];

    // Generar archivo
    const fileName = `Resumen_General_${caja.codigo}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);

    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error('Error al descargar:', err);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    });
  } catch (error) {
    console.error('Error al generar reporte general:', error);
    res.status(500).json({
      mensaje: 'Error al generar reporte general',
      error: error.message,
    });
  }
};

module.exports = {
  generarReporteMensual,
  generarReporteGeneral,
};
