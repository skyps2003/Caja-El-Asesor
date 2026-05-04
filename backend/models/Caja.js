const mongoose = require('mongoose');

const CajaSchema = new mongoose.Schema(
  {
    id_sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sede',
      required: [true, 'La sede es obligatoria'],
    },
    codigo: {
      type: String,
      required: [true, 'El codigo de caja es obligatorio'],
      trim: true,
    },
    nombre_caja: {
      type: String,
      required: [true, 'El nombre de la caja es obligatorio'],
      trim: true,
    },
    saldo_minimo: {
      type: Number,
      required: [true, 'El saldo minimo es obligatorio'],
      default: 0,
    },
    saldo_maximo: {
      type: Number,
      required: [true, 'El saldo maximo es obligatorio'],
    },
    saldo_actual: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Caja', CajaSchema);
