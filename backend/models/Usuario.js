const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    login_usuario: {
      type: String,
      required: [true, 'El login de usuario es obligatorio'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'La contrasena es obligatoria'],
    },
    rol: {
      type: String,
      enum: ['ADMINISTRADOR', 'CAJERO_SEDE'],
      required: [true, 'El rol es obligatorio'],
    },
    id_sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sede',
      required: [true, 'La sede es obligatoria'],
    },
    avatar: {
      type: String,
      default: '',
    },
    estado: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', UsuarioSchema);
