const mongoose = require('mongoose');
const Movimiento = require('../models/Movimiento');
const Caja = require('../models/Caja');

// ── Crear Movimiento (TRANSACCIONAL) ───────────────────────
// Usa Mongoose Sessions para garantizar atomicidad:
// 1. Valida que la caja exista.
// 2. Calcula el nuevo saldo segun el tipo (0=Entrada, 1=Salida).
// 3. Valida que el saldo resultante este dentro de los limites.
// 4. Crea el movimiento y actualiza el saldo de la caja en una sola transaccion.
const crearMovimiento = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      id_caja,
      id_usuario,
      tipo,
      concepto,
      monto,
      tiene_recibo,
      nro_recibo,
      motivo_sin_recibo,
      observaciones,
    } = req.body;

    // ── 1. Obtener la caja dentro de la transaccion ──────────
    const caja = await Caja.findById(id_caja).session(session);
    if (!caja) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ mensaje: 'Caja no encontrada' });
    }

    // ── 2. Calcular saldo resultante segun tipo ──────────────
    let saldo_resultante;

    if (tipo === false || tipo === 0) {
      // ENTRADA: sumar monto al saldo actual
      saldo_resultante = caja.saldo_actual + monto;
    } else if (tipo === true || tipo === 1) {
      // SALIDA: restar monto del saldo actual
      saldo_resultante = caja.saldo_actual - monto;
    } else {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ mensaje: 'El tipo de movimiento debe ser 0 (Entrada) o 1 (Salida)' });
    }

    // ── 3. Validar limites de saldo ──────────────────────────
    if (saldo_resultante < caja.saldo_minimo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        mensaje: `Saldo insuficiente. El saldo resultante (${saldo_resultante}) es menor al saldo minimo permitido (${caja.saldo_minimo})`,
      });
    }

    if (saldo_resultante > caja.saldo_maximo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        mensaje: `El saldo resultante (${saldo_resultante}) excede el saldo maximo permitido (${caja.saldo_maximo})`,
      });
    }

    // ── 4. Determinar estado de sustento ─────────────────────
    let estado_sustento = 'APROBADO';
    if (tiene_recibo === false) {
      estado_sustento = 'PENDIENTE_SUSTENTO';
    }

    // ── 5. Crear el movimiento dentro de la transaccion ──────
    const nuevoMovimiento = new Movimiento({
      fecha_hora: new Date(),
      id_caja,
      id_usuario,
      tipo,
      concepto,
      monto,
      saldo_resultante,
      tiene_recibo,
      nro_recibo: tiene_recibo ? nro_recibo : null,
      motivo_sin_recibo: !tiene_recibo ? motivo_sin_recibo : null,
      estado_sustento,
      observaciones,
    });

    await nuevoMovimiento.save({ session });

    // ── 6. Actualizar saldo de la caja ───────────────────────
    caja.saldo_actual = saldo_resultante;
    await caja.save({ session });

    // ── 7. Confirmar transaccion ─────────────────────────────
    await session.commitTransaction();
    session.endSession();

    // Poblar referencias para la respuesta
    const movimientoPoblado = await Movimiento.findById(nuevoMovimiento._id)
      .populate('id_caja', 'codigo nombre_caja saldo_actual')
      .populate('id_usuario', 'login_usuario rol');

    res.status(201).json({
      mensaje: 'Movimiento registrado exitosamente',
      movimiento: movimientoPoblado,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error en transaccion de movimiento:', error);
    res.status(500).json({
      mensaje: 'Error al registrar el movimiento',
      error: error.message,
    });
  }
};

// ── Obtener todos los movimientos ────────────────────────────
const obtenerMovimientos = async (req, res) => {
  try {
    const movimientos = await Movimiento.find()
      .populate('id_caja', 'codigo nombre_caja')
      .populate('id_usuario', 'login_usuario rol')
      .sort({ fecha_hora: -1 });

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
  }
};

// ── Obtener movimientos por caja ─────────────────────────────
const obtenerMovimientosPorCaja = async (req, res) => {
  try {
    const movimientos = await Movimiento.find({ id_caja: req.params.idCaja })
      .populate('id_caja', 'codigo nombre_caja')
      .populate('id_usuario', 'login_usuario rol')
      .sort({ fecha_hora: -1 });

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
  }
};

module.exports = {
  crearMovimiento,
  obtenerMovimientos,
  obtenerMovimientosPorCaja,
};
