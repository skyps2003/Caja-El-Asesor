const Cierre = require('../models/Cierre');
const Movimiento = require('../models/Movimiento');
const Caja = require('../models/Caja');

// ─── Helper: calcular ingresos/egresos de un array de movimientos ──────────
const calcularTotales = (movimientos) => {
  let total_ingresos = 0;
  let total_egresos = 0;
  movimientos.forEach((mov) => {
    if (!mov.tipo) total_ingresos += mov.monto; // tipo=false → ENTRADA
    else total_egresos += mov.monto;            // tipo=true  → SALIDA
  });
  return { total_ingresos, total_egresos };
};

// ─── Helper: obtener IDs de cajas de una sede ──────────────────────────────
const getCajasDeSede = async (id_sede) => {
  const cajas = await Caja.find({ id_sede }).select('_id saldo_actual');
  return cajas;
};

// ─── GET /api/cierres — Lista todos los cierres ───────────────────────────
exports.listarCierres = async (req, res) => {
  try {
    const filtro = {};
    if (req.usuario.rol === 'CAJERO_SEDE') {
      filtro.id_sede = req.usuario.id_sede?._id || req.usuario.id_sede;
    }

    const cierres = await Cierre.find(filtro)
      .populate('id_sede', 'nombre')
      .populate('id_usuario', 'nombre')
      .sort({ fecha_cierre: -1 })
      .limit(100);

    res.json(cierres);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cierres', error });
  }
};

// ─── GET /api/cierres/resumen/diario — Totales agrupados por día ────────────
exports.resumenDiario = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    let filtro = {};

    // Si es cajero, filtrar solo por sus cajas
    if (req.usuario.rol === 'CAJERO_SEDE') {
      const idSede = req.usuario.id_sede?._id || req.usuario.id_sede;
      const cajas = await getCajasDeSede(idSede);
      filtro.id_caja = { $in: cajas.map(c => c._id) };
    }

    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - parseInt(dias));

    const movimientos = await Movimiento.find({
      ...filtro,
      fecha_hora: { $gte: fechaDesde },
    }).sort({ fecha_hora: 1 });

    const porDia = {};
    movimientos.forEach((mov) => {
      const dia = mov.fecha_hora.toISOString().split('T')[0];
      if (!porDia[dia]) porDia[dia] = { fecha: dia, ingresos: 0, egresos: 0, movimientos: 0 };
      porDia[dia].movimientos++;
      if (!mov.tipo) porDia[dia].ingresos += mov.monto;
      else porDia[dia].egresos += mov.monto;
    });

    const resultado = Object.values(porDia).map((d) => ({
      ...d,
      neto: d.ingresos - d.egresos,
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular resumen diario', error });
  }
};

// ─── GET /api/cierres/resumen/mensual — Totales agrupados por mes ───────────
exports.resumenMensual = async (req, res) => {
  try {
    let matchStage = {};

    if (req.usuario.rol === 'CAJERO_SEDE') {
      const idSede = req.usuario.id_sede?._id || req.usuario.id_sede;
      const cajas = await getCajasDeSede(idSede);
      matchStage = { id_caja: { $in: cajas.map(c => c._id) } };
    }

    const pipeline = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: { año: { $year: '$fecha_hora' }, mes: { $month: '$fecha_hora' } },
          ingresos: { $sum: { $cond: [{ $eq: ['$tipo', false] }, '$monto', 0] } },
          egresos: { $sum: { $cond: [{ $eq: ['$tipo', true] }, '$monto', 0] } },
          movimientos: { $sum: 1 },
        },
      },
      { $sort: { '_id.año': 1, '_id.mes': 1 } },
    ];

    const resultado = await Movimiento.aggregate(pipeline);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const formateado = resultado.map((r) => ({
      mes: `${meses[r._id.mes - 1]} ${r._id.año}`,
      ingresos: r.ingresos,
      egresos: r.egresos,
      neto: r.ingresos - r.egresos,
      movimientos: r.movimientos,
    }));

    res.json(formateado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular resumen mensual', error });
  }
};

// ─── GET /api/cierres/previsualizar/sede — Pre-cierre global de una Sede ─────
exports.previsualizarCierre = async (req, res) => {
  try {
    const idSede = req.usuario.id_sede?._id || req.usuario.id_sede;
    const cajas = await getCajasDeSede(idSede);
    const cajaIds = cajas.map(c => c._id);

    // Buscar el último cierre de esta sede
    const ultimoCierre = await Cierre.findOne({ id_sede: idSede }).sort({ fecha_cierre: -1 });
    const fechaInicio = ultimoCierre ? ultimoCierre.fecha_cierre : new Date(0);
    const saldoApertura = ultimoCierre ? ultimoCierre.saldo_real : 0;

    // Movimientos de todas las cajas desde el último cierre
    const movimientos = await Movimiento.find({
      id_caja: { $in: cajaIds },
      fecha_hora: { $gt: fechaInicio },
    }).populate('id_caja', 'codigo nombre_caja');

    const { total_ingresos, total_egresos } = calcularTotales(movimientos);
    const saldo_esperado = saldoApertura + total_ingresos - total_egresos;

    // Saldo actual real de todas las cajas
    const saldo_sistema = cajas.reduce((acc, c) => acc + (c.saldo_actual || 0), 0);

    res.json({
      fecha_inicio: fechaInicio,
      movimientos_pendientes: movimientos.length,
      saldo_apertura: saldoApertura,
      total_ingresos,
      total_egresos,
      saldo_esperado,
      saldo_sistema,
      cajas_incluidas: cajas.length,
      movimientos_detalle: movimientos.slice(0, 100), // últimos 100 para el PDF
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular pre-cierre', error });
  }
};

// ─── GET /api/cierres/movimientos-periodo — Movimientos de la sede por rango de fechas ─
exports.movimientosPeriodo = async (req, res) => {
  try {
    const idSede = req.usuario.id_sede?._id || req.usuario.id_sede;
    const { tipo = 'DIARIO', fecha } = req.query; // tipo: DIARIO | MENSUAL, fecha: YYYY-MM-DD o YYYY-MM
    const cajas = await getCajasDeSede(idSede);
    const cajaIds = cajas.map(c => c._id);

    let fechaDesde, fechaHasta;
    if (tipo === 'DIARIO') {
      const d = fecha ? new Date(fecha) : new Date();
      fechaDesde = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      fechaHasta = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    } else {
      // MENSUAL
      const parts = fecha ? fecha.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1];
      const año = parseInt(parts[0]);
      const mes = parseInt(parts[1]) - 1;
      fechaDesde = new Date(año, mes, 1, 0, 0, 0);
      fechaHasta = new Date(año, mes + 1, 0, 23, 59, 59);
    }

    const movimientos = await Movimiento.find({
      id_caja: { $in: cajaIds },
      fecha_hora: { $gte: fechaDesde, $lte: fechaHasta },
    })
      .populate('id_caja', 'codigo nombre_caja')
      .populate('id_usuario', 'nombre')
      .sort({ fecha_hora: 1 });

    const { total_ingresos, total_egresos } = calcularTotales(movimientos);

    res.json({
      periodo: tipo,
      fecha_inicio: fechaDesde,
      fecha_fin: fechaHasta,
      total_movimientos: movimientos.length,
      total_ingresos,
      total_egresos,
      neto: total_ingresos - total_egresos,
      movimientos,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener movimientos del período', error });
  }
};

// ─── POST /api/cierres — Registrar cierre global de Sede ─────────────────
exports.registrarCierre = async (req, res) => {
  try {
    const { tipo, saldo_real, observaciones } = req.body;
    const id_usuario = req.usuario.id;
    const idSede = req.usuario.id_sede?._id || req.usuario.id_sede;

    if (!tipo || saldo_real === undefined) {
      return res.status(400).json({ mensaje: 'Faltan campos requeridos: tipo, saldo_real' });
    }

    const cajas = await getCajasDeSede(idSede);
    const cajaIds = cajas.map(c => c._id);

    const ultimoCierre = await Cierre.findOne({ id_sede: idSede }).sort({ fecha_cierre: -1 });
    const fechaInicio = ultimoCierre ? ultimoCierre.fecha_cierre : new Date(0);
    const saldoApertura = ultimoCierre ? ultimoCierre.saldo_real : 0;

    const movimientos = await Movimiento.find({
      id_caja: { $in: cajaIds },
      fecha_hora: { $gt: fechaInicio },
    });

    if (movimientos.length === 0) {
      return res.status(400).json({ mensaje: 'No hay movimientos pendientes de cerrar en esta sede.' });
    }

    const { total_ingresos, total_egresos } = calcularTotales(movimientos);
    const saldo_esperado = saldoApertura + total_ingresos - total_egresos;
    const diferencia = parseFloat(saldo_real) - saldo_esperado;

    const nuevoCierre = await Cierre.create({
      id_sede: idSede,
      id_usuario,
      tipo,
      fecha_inicio: fechaInicio,
      saldo_apertura: saldoApertura,
      total_ingresos,
      total_egresos,
      saldo_esperado,
      saldo_real: parseFloat(saldo_real),
      diferencia,
      total_movimientos: movimientos.length,
      observaciones,
    });

    await nuevoCierre.populate('id_sede', 'nombre');
    await nuevoCierre.populate('id_usuario', 'nombre');

    res.status(201).json({
      mensaje: `Cierre ${tipo.toLowerCase()} registrado exitosamente para la Sede.`,
      cierre: nuevoCierre,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar el cierre', error: error.message });
  }
};