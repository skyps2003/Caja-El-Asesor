const mongoose = require('mongoose');

const SedeSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la sede es obligatorio'],
      trim: true,
    },
    direccion: {
      type: String,
      required: [true, 'La direccion es obligatoria'],
      trim: true,
    },
    estado: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sede', SedeSchema);
