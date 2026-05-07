const mongoose = require('mongoose');

const PeriodoMensualSchema = new mongoose.Schema(
  {
    id_caja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caja',
      required: true,
    },
    id_sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sede',
      required: true,
    },
    mes: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    anio: {
      type: Number,
      required: true,
    },
    saldo_inicial: {
      type: Number,
      default: 500,
    },
    fecha_inicio: {
      type: Date,
      required: true,
    },
    fecha_fin: {
      type: Date,
      default: null,
    },
    total_ingresos: {
      type: Number,
      default: 0,
    },
    total_egresos: {
      type: Number,
      default: 0,
    },
    saldo_final: {
      type: Number,
      default: 0,
    },
    estado: {
      type: String,
      enum: ['ABIERTO', 'CERRADO'],
      default: 'ABIERTO',
    },
    id_usuario_cierre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
  },
  { timestamps: true }
);

// Índice compuesto para evitar duplicados por caja, mes y año
PeriodoMensualSchema.index({ id_caja: 1, mes: 1, anio: 1 }, { unique: true });

module.exports = mongoose.model('PeriodoMensual', PeriodoMensualSchema);
