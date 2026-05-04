const mongoose = require('mongoose');

const MovimientoSchema = new mongoose.Schema(
  {
    fecha_hora: {
      type: Date,
      default: Date.now,
    },
    id_caja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caja',
      required: [true, 'La caja es obligatoria'],
    },
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio'],
    },
    tipo: {
      type: Boolean, // false (0) = Entrada, true (1) = Salida
      required: [true, 'El tipo de movimiento es obligatorio'],
    },
    concepto: {
      type: String,
      required: [true, 'El concepto es obligatorio'],
      trim: true,
    },
    monto: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0.01, 'El monto debe ser mayor a cero'],
    },
    saldo_resultante: {
      type: Number,
      required: true,
    },
    tiene_recibo: {
      type: Boolean,
      default: true,
    },
    nro_recibo: {
      type: String,
      trim: true,
      default: null,
    },
    motivo_sin_recibo: {
      type: String,
      trim: true,
      default: null,
    },
    estado_sustento: {
      type: String,
      enum: ['APROBADO', 'PENDIENTE_SUSTENTO'],
      default: 'APROBADO',
    },
    observaciones: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movimiento', MovimientoSchema);
