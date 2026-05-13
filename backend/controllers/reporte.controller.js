const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Movimiento = require('../models/Movimiento');
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

    // --- AGREGAR LOGO (En 4 celdas aprox A1:D6) ---
    const logoPath = path.join(__dirname, '../../frontend/public/Logo para claro.png');
    if (fs.existsSync(logoPath)) {
      const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
      });
      worksheet.addImage(logoId, {
        tl: { col: 0.1, row: 0.1 },
        br: { col: 4.5, row: 6 } // Aproximadamente A1:E6
      });
    }

    // --- ESTILOS ---
    const borderFull = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    const fillHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } }; // Amarillo suave
    const fillGreen = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }; // Verde suave (Saldo)
    const fillBlue = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }; // Azul suave
    const fontPrimary = { name: 'Arial', size: 9 };
    
    // 1. Listado de Tipos de Caja (A7:B12)
    worksheet.mergeCells('A7:B7');
    worksheet.getCell('A7').value = 'Liste los Tipos de Caja';
    worksheet.getCell('A7').font = { italic: true, color: { argb: 'FFCC7A00' } };

    worksheet.getCell('A8').value = 'Nro.';
    worksheet.getCell('B8').value = 'Tipo de Caja';
    worksheet.getCell('A8').fill = fillHeader;
    worksheet.getCell('B8').fill = fillHeader;
    worksheet.getCell('A8').border = borderFull;
    worksheet.getCell('B8').border = borderFull;

    todasLasCajas.forEach((c, i) => {
      const row = 9 + i;
      worksheet.getCell(`A${row}`).value = c.codigo;
      worksheet.getCell(`B${row}`).value = c.nombre_caja;
      worksheet.getCell(`A${row}`).border = borderFull;
      worksheet.getCell(`B${row}`).border = borderFull;
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    });

    // 2. Saldos a mantener (E7:H10)
    worksheet.mergeCells('E7:H7');
    worksheet.getCell('E7').value = 'Ingrese los saldos a mantener en caja';
    worksheet.getCell('E7').font = { italic: true, color: { argb: 'FFCC7A00' } };
    worksheet.getCell('E7').alignment = { horizontal: 'center' };

    worksheet.getCell('G8').value = 'Mínimo:';
    worksheet.getCell('H8').value = 500;
    worksheet.getCell('H8').numFmt = '"S/ " #,##0.00';
    worksheet.getCell('G9').value = 'Máximo:';
    worksheet.getCell('H9').value = 10000;
    worksheet.getCell('H9').numFmt = '"S/ " #,##0.00';
    
    worksheet.getCell('G8').fill = fillHeader;
    worksheet.getCell('H8').fill = fillHeader;
    worksheet.getCell('G9').fill = fillHeader;
    worksheet.getCell('H9').fill = fillHeader;
    worksheet.getCell('G8').font = { color: { argb: 'FF38761D' }, bold: true };
    worksheet.getCell('G9').font = { color: { argb: 'FF38761D' }, bold: true };

    // 3. Saldo Total y Mensaje (L8:P8)
    const saldoTotalSede = todasLasCajas.reduce((acc, curr) => acc + curr.saldo_actual, 0);
    worksheet.mergeCells('L8:P8'); 
    const cellSaldo = worksheet.getCell('L8');
    cellSaldo.value = `SALDO TOTAL DE CAJA        S/ ${saldoTotalSede.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    cellSaldo.alignment = { horizontal: 'center', vertical: 'middle' };
    cellSaldo.font = { bold: true, color: { argb: 'FF38761D' }, size: 10 };
    
    // Borde rojo grueso como en la imagen
    cellSaldo.border = {
      top: { style: 'thin', color: { argb: 'FFFF0000' } },
      left: { style: 'thin', color: { argb: 'FFFF0000' } },
      bottom: { style: 'thin', color: { argb: 'FFFF0000' } },
      right: { style: 'thin', color: { argb: 'FFFF0000' } }
    };

    // 4. Tabla de Movimientos (A16...)
    worksheet.mergeCells('A16:D16');
    worksheet.getCell('A16').value = 'Ingrese los movimientos de caja diarios';
    worksheet.getCell('A16').font = { italic: true, color: { argb: 'FFCC7A00' } };

    const headerPositions = [
      { col: 1, val: 'FECHA' },
      { col: 2, val: 'CONCEPTO', merge: 'B17:D17' },
      { col: 5, val: 'CÓDIGO' },
      { col: 6, val: 'N° RECIBO' },
      { col: 7, val: 'ENTRADAS' },
      { col: 8, val: 'SALIDAS' },
      { col: 9, val: 'SALDO' }
    ];

    headerPositions.forEach((h) => {
      const cell = worksheet.getCell(17, h.col);
      cell.value = h.val;
      cell.fill = fillHeader;
      cell.border = borderFull;
      cell.font = { bold: true, color: { argb: 'FF7F6000' }, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (h.merge) worksheet.mergeCells(h.merge);
    });

    let currentRow = 18;
    let saldoAcumulado = 0; // O tal vez el saldo inicial del periodo?
    
    movimientos.forEach((mov) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(mov.fecha_hora).toLocaleDateString('es-PE');
      
      // Concepto fusionado B-D
      worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
      let desc = mov.concepto || 'Sin descripción';
      if (mov.tipo_comprobante === 'FACTURA') {
        desc += ` (RUC: ${mov.ruc || '—'} - ${mov.razon_social || '—'})`;
      }
      worksheet.getCell(`B${currentRow}`).value = desc;

      const c = todasLasCajas.find(c => c._id.toString() === mov.id_caja.toString());
      worksheet.getCell(`E${currentRow}`).value = c ? c.codigo : '—';
      
      const compPrefix = mov.tipo_comprobante === 'FACTURA' ? 'FAC' : mov.tipo_comprobante === 'RECIBO' ? 'REC' : '';
      worksheet.getCell(`F${currentRow}`).value = compPrefix ? `${compPrefix}: ${mov.numero_comprobante || 'S/N'}` : 'S/C';
      
      if (mov.tipo === false || mov.tipo === 0) {
        worksheet.getCell(`G${currentRow}`).value = mov.monto;
        worksheet.getCell(`G${currentRow}`).numFmt = '"S/ " #,##0.00';
      } else {
        worksheet.getCell(`H${currentRow}`).value = mov.monto;
        worksheet.getCell(`H${currentRow}`).numFmt = '"S/ " #,##0.00';
      }

      const cellSaldoResult = worksheet.getCell(`I${currentRow}`);
      cellSaldoResult.value = mov.saldo_resultante;
      cellSaldoResult.numFmt = '"S/ " #,##0.00';
      cellSaldoResult.fill = fillGreen; // EL VERDE que solicitaste
      
      // Bordes punteados para el cuerpo (A-I)
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
        worksheet.getCell(`${col}${currentRow}`).border = {
          left: { style: 'dotted' }, right: { style: 'dotted' }, bottom: { style: 'dotted' }
        };
        worksheet.getCell(`${col}${currentRow}`).alignment = { vertical: 'middle' };
      });

      currentRow++;
    });

    // 5. Tabla resumen por tipo (L11...)
    let resRow = 11;
    worksheet.mergeCells(`M${resRow}:N${resRow}`);
    worksheet.getCell(`M${resRow}`).value = 'RESUMEN DE SALDOS POR CUENTA';
    worksheet.getCell(`M${resRow}`).fill = fillHeader;
    worksheet.getCell(`M${resRow}`).font = { bold: true, color: { argb: 'FF38761D' } };
    worksheet.getCell(`M${resRow}`).alignment = { horizontal: 'center' };
    resRow++;

    worksheet.getCell(`M${resRow}`).value = 'TIPO DE CUENTA / CAJA';
    worksheet.getCell(`N${resRow}`).value = 'SALDO ACTUAL';
    worksheet.getCell(`M${resRow}`).font = { bold: true, size: 9 };
    worksheet.getCell(`N${resRow}`).font = { bold: true, size: 9 };
    worksheet.getCell(`M${resRow}`).border = borderFull;
    worksheet.getCell(`N${resRow}`).border = borderFull;
    resRow++;

    todasLasCajas.forEach(c => {
      worksheet.getCell(`M${resRow}`).value = c.nombre_caja;
      worksheet.getCell(`N${resRow}`).value = c.saldo_actual;
      worksheet.getCell(`N${resRow}`).numFmt = '"S/ " #,##0.00';
      worksheet.getCell(`M${resRow}`).fill = fillBlue;
      worksheet.getCell(`N${resRow}`).fill = fillBlue;
      worksheet.getCell(`M${resRow}`).border = borderFull;
      worksheet.getCell(`N${resRow}`).border = borderFull;
      resRow++;
    });

    // Añadir una instrucción para el gráfico de donas
    resRow++;
    worksheet.mergeCells(`M${resRow}:N${resRow}`);
    worksheet.getCell(`M${resRow}`).value = '💡 Tip: Seleccione la tabla de arriba e inserte un "Gráfico de Donas" para visualizar la distribución.';
    worksheet.getCell(`M${resRow}`).font = { italic: true, size: 8, color: { argb: 'FF555555' } };
    worksheet.getCell(`M${resRow}`).alignment = { wrapText: true };

    // Ajustar anchos
    worksheet.getColumn('A').width = 12;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 15;
    worksheet.getColumn('D').width = 15; // B+C+D para concepto
    worksheet.getColumn('E').width = 12;
    worksheet.getColumn('F').width = 20;
    worksheet.getColumn('G').width = 15;
    worksheet.getColumn('H').width = 15;
    worksheet.getColumn('I').width = 18; // El verde (Saldo)
    worksheet.getColumn('L').width = 25;
    worksheet.getColumn('M').width = 30;
    worksheet.getColumn('N').width = 18;

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

module.exports = {
  generarReporteMensual,
};
