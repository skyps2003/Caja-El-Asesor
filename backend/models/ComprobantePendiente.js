const mongoose = require('mongoose');

const ComprobantePendienteSchema = new mongoose.Schema(
  {
    id_sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sede',
      required: true,
    },
    id_usuario_creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    tipo_comprobante: {
      type: String,
      enum: ['FACTURA', 'RECIBO'],
      required: true,
    },
    numero_solicitado: {
      type: String,
      required: true,
      trim: true,
    },
    cantidad_solicitada: {
      type: Number,
      required: true,
      min: 1,
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO'],
      default: 'PENDIENTE',
    },
    motivo_rechazo: {
      type: String,
      trim: true,
      default: null,
    },
    id_usuario_aprobador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
    fecha_aprobacion: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComprobantePendiente', ComprobantePendienteSchema);
