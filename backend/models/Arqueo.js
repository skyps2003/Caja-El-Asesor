const mongoose = require('mongoose');

const ArqueoSchema = new mongoose.Schema(
  {
    fecha_hora: {
      type: Date,
      default: Date.now,
    },
    id_sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sede',
      required: [true, 'La sede es obligatoria'],
    },
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio'],
    },
    saldo_sistema: {
      type: Number,
      required: [true, 'El saldo del sistema es obligatorio'],
    },
    saldo_fisico: {
      type: Number,
      required: [true, 'El saldo fisico es obligatorio'],
    },
    diferencia: {
      type: Number,
      required: true,
    },
    estado: {
      type: String,
      enum: ['CUADRADO', 'SOBRANTE', 'FALTANTE'],
      required: [true, 'El estado del arqueo es obligatorio'],
    },
    observaciones: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Arqueo', ArqueoSchema);
