const mongoose = require('mongoose');
const PeriodoMensual = require('../models/PeriodoMensual');
const Caja = require('../models/Caja');
const Movimiento = require('../models/Movimiento');

// ── Obtener o crear período mensual actual ───────────────────
const obtenerPeriodoActual = async (id_caja) => {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  let periodo = await PeriodoMensual.findOne({
    id_caja,
    mes,
    anio,
  });

  if (!periodo) {
    // Obtener la caja para conseguir el id_sede
    const caja = await Caja.findById(id_caja);
    if (!caja) {
      throw new Error('Caja no encontrada');
    }

    // Crear nuevo período
    const primerDiaMes = new Date(anio, mes - 1, 1);
    periodo = new PeriodoMensual({
      id_caja,
      id_sede: caja.id_sede,
      mes,
      anio,
      saldo_inicial: 0,
      fecha_inicio: primerDiaMes,
      estado: 'ABIERTO',
    });

    await periodo.save();

    // Actualizar saldo actual de la caja si es el primer período del mes
    caja.saldo_actual = 0;
    await caja.save();
  }

  return periodo;
};

// ── Obtener período mensual por caja ─────────────────────────
const obtenerPeriodoMensual = async (req, res) => {
  try {
    const { id_caja } = req.params;

    const periodo = await obtenerPeriodoActual(id_caja);

    // Calcular totales de ingresos y egresos para el período
    const movimientos = await Movimiento.find({
      id_caja,
      createdAt: {
        $gte: periodo.fecha_inicio,
        $lte: periodo.fecha_fin || new Date(),
      },
    });

    let total_ingresos = 0;
    let total_egresos = 0;

    movimientos.forEach((mov) => {
      if (mov.tipo === false || mov.tipo === 0) {
        total_ingresos += mov.monto;
      } else {
        total_egresos += mov.monto;
      }
    });

    const saldo_actual = periodo.saldo_inicial + total_ingresos - total_egresos;

    res.json({
      periodo: {
        ...periodo.toObject(),
        total_ingresos,
        total_egresos,
        saldo_actual,
      },
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener período mensual',
      error: error.message,
    });
  }
};

// ── Cerrar período mensual (fin de mes) ──────────────────────
const cerrarPeriodoMensual = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id_caja } = req.params;
    const { saldo_real } = req.body;
    const id_usuario_cierre = req.usuario._id;

    if (typeof saldo_real !== 'number' || saldo_real < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        mensaje: 'Debe proporcionar un saldo real válido',
      });
    }

    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    const periodo = await PeriodoMensual.findOne({
      id_caja,
      mes,
      anio,
      estado: 'ABIERTO',
    }).session(session);

    if (!periodo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        mensaje: 'Período mensual no encontrado o ya está cerrado',
      });
    }

    // Calcular totales
    const movimientos = await Movimiento.find({
      id_caja,
      createdAt: {
        $gte: periodo.fecha_inicio,
        $lte: new Date(),
      },
    }).session(session);

    let total_ingresos = 0;
    let total_egresos = 0;

    movimientos.forEach((mov) => {
      if (mov.tipo === false || mov.tipo === 0) {
        total_ingresos += mov.monto;
      } else {
        total_egresos += mov.monto;
      }
    });

    const saldo_esperado =
      periodo.saldo_inicial + total_ingresos - total_egresos;
    const diferencia = saldo_real - saldo_esperado;

    // Actualizar período
    periodo.fecha_fin = new Date();
    periodo.total_ingresos = total_ingresos;
    periodo.total_egresos = total_egresos;
    periodo.saldo_final = saldo_real;
    periodo.estado = 'CERRADO';
    periodo.id_usuario_cierre = id_usuario_cierre;

    await periodo.save({ session });

    // Resetear saldo de la caja a 0 para el nuevo período
    const caja = await Caja.findById(id_caja).session(session);
    if (caja) {
      caja.saldo_actual = 0;
      await caja.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const periodoPoblado = await PeriodoMensual.findById(periodo._id).populate(
      'id_usuario_cierre',
      'login_usuario nombre'
    );

    res.json({
      mensaje: 'Período mensual cerrado exitosamente',
      periodo: periodoPoblado,
      diferencia,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      mensaje: 'Error al cerrar período mensual',
      error: error.message,
    });
  }
};

// ── Obtener historial de períodos ────────────────────────────
const obtenerHistorialPeriodos = async (req, res) => {
  try {
    const { id_caja } = req.params;

    const periodos = await PeriodoMensual.find({ id_caja })
      .populate('id_usuario_cierre', 'login_usuario nombre')
      .sort({ anio: -1, mes: -1 });

    res.json(periodos);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener historial de períodos',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerPeriodoActual,
  obtenerPeriodoMensual,
  cerrarPeriodoMensual,
  obtenerHistorialPeriodos,
};
