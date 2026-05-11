const mongoose = require('mongoose');
const ComprobantePendiente = require('../models/ComprobantePendiente');
const Movimiento = require('../models/Movimiento');

// ── Solicitar asignación de comprobante ──────────────────────
const solicitarComprobante = async (req, res) => {
  try {
    const {
      id_sede,
      tipo_comprobante,
      numero_solicitado,
      cantidad_solicitada,
      descripcion,
    } = req.body;

    const id_usuario_creador = req.usuario._id;

    // Validar tipo de comprobante
    if (!['FACTURA', 'RECIBO'].includes(tipo_comprobante)) {
      return res.status(400).json({
        mensaje: 'El tipo de comprobante debe ser FACTURA o RECIBO',
      });
    }

    const nuevoComprobante = new ComprobantePendiente({
      id_sede,
      id_usuario_creador,
      tipo_comprobante,
      numero_solicitado,
      cantidad_solicitada,
      descripcion,
    });

    await nuevoComprobante.save();

    const comprobantePoblado = await ComprobantePendiente.findById(nuevoComprobante._id)
      .populate('id_usuario_creador', 'login_usuario nombre')
      .populate('id_sede', 'nombre_sede');

    res.status(201).json({
      mensaje: 'Solicitud de comprobante enviada',
      comprobante: comprobantePoblado,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al solicitar comprobante',
      error: error.message,
    });
  }
};

// ── Obtener comprobantes pendientes ──────────────────────────
const obtenerComprobantesPendientes = async (req, res) => {
  try {
    const filtro = { estado: 'PENDIENTE' };

    // Si es admin de una sede, solo mostrar de esa sede
    if (req.usuario.rol === 'ADMIN_SEDE') {
      filtro.id_sede = req.usuario.id_sede;
    }

    const comprobantes = await ComprobantePendiente.find(filtro)
      .populate('id_usuario_creador', 'login_usuario nombre')
      .populate('id_usuario_aprobador', 'login_usuario nombre')
      .populate('id_sede', 'nombre_sede')
      .sort({ createdAt: -1 });

    res.json(comprobantes);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener comprobantes pendientes',
      error: error.message,
    });
  }
};

// ── Aprobar solicitud de comprobante ─────────────────────────
const aprobarComprobante = async (req, res) => {
  try {
    const { id_comprobante } = req.params;
    const id_usuario_aprobador = req.usuario._id;

    const comprobante = await ComprobantePendiente.findByIdAndUpdate(
      id_comprobante,
      {
        estado: 'APROBADO',
        id_usuario_aprobador,
        fecha_aprobacion: new Date(),
      },
      { returnDocument: 'after' }
    )
      .populate('id_usuario_creador', 'login_usuario nombre')
      .populate('id_usuario_aprobador', 'login_usuario nombre')
      .populate('id_sede', 'nombre_sede');

    if (!comprobante) {
      return res.status(404).json({ mensaje: 'Comprobante no encontrado' });
    }

    res.json({
      mensaje: 'Comprobante aprobado',
      comprobante,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al aprobar comprobante',
      error: error.message,
    });
  }
};

// ── Rechazar solicitud de comprobante ────────────────────────
const rechazarComprobante = async (req, res) => {
  try {
    const { id_comprobante } = req.params;
    const { motivo_rechazo } = req.body;
    const id_usuario_aprobador = req.usuario._id;

    if (!motivo_rechazo || motivo_rechazo.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un motivo de rechazo',
      });
    }

    const comprobante = await ComprobantePendiente.findByIdAndUpdate(
      id_comprobante,
      {
        estado: 'RECHAZADO',
        id_usuario_aprobador,
        motivo_rechazo,
        fecha_aprobacion: new Date(),
      },
      { returnDocument: 'after' }
    )
      .populate('id_usuario_creador', 'login_usuario nombre')
      .populate('id_usuario_aprobador', 'login_usuario nombre')
      .populate('id_sede', 'nombre_sede');

    if (!comprobante) {
      return res.status(404).json({ mensaje: 'Comprobante no encontrado' });
    }

    res.json({
      mensaje: 'Comprobante rechazado',
      comprobante,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al rechazar comprobante',
      error: error.message,
    });
  }
};

// ── Asignar número de comprobante a movimiento ───────────────
const asignarComprobanteAMovimiento = async (req, res) => {
  try {
    const { id_movimiento } = req.params;
    const { numero_comprobante, tipo_comprobante } = req.body;

    if (!numero_comprobante || numero_comprobante.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un número de comprobante',
      });
    }

    const movimiento = await Movimiento.findByIdAndUpdate(
      id_movimiento,
      {
        numero_comprobante,
        tipo_comprobante,
        estado_comprobante: 'ASIGNADO',
      },
      { returnDocument: 'after' }
    )
      .populate('id_caja', 'codigo nombre_caja')
      .populate('id_usuario', 'login_usuario nombre');

    if (!movimiento) {
      return res.status(404).json({ mensaje: 'Movimiento no encontrado' });
    }

    res.json({
      mensaje: 'Comprobante asignado al movimiento',
      movimiento,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al asignar comprobante',
      error: error.message,
    });
  }
};

// ── Obtener movimientos sin comprobante ──────────────────────
const obtenerMovimientosSinComprobante = async (req, res) => {
  try {
    const filtro = { estado_comprobante: 'PENDIENTE_ASIGNACION' };

    // Si es cajero de sede, solo movimientos de su sede
    if (req.usuario.rol === 'CAJERO_SEDE') {
      const Caja = require('../models/Caja');
      const cajasSede = await Caja.find({ id_sede: req.usuario.id_sede }).select('_id');
      filtro.id_caja = { $in: cajasSede.map(c => c._id) };
    }

    const movimientos = await Movimiento.find(filtro)
      .populate('id_caja', 'codigo nombre_caja')
      .populate('id_usuario', 'login_usuario nombre')
      .sort({ fecha_hora: -1 });

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener movimientos sin comprobante',
      error: error.message,
    });
  }
};

module.exports = {
  solicitarComprobante,
  obtenerComprobantesPendientes,
  aprobarComprobante,
  rechazarComprobante,
  asignarComprobanteAMovimiento,
  obtenerMovimientosSinComprobante,
};
