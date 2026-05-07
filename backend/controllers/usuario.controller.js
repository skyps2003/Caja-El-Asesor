const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const crearUsuario = async (req, res) => {
  try {
    const { nombre, login_usuario, password, rol, id_sede } = req.body;

    const existente = await Usuario.findOne({ login_usuario });
    if (existente) {
      return res.status(400).json({ mensaje: 'El login de usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = new Usuario({
      nombre,
      login_usuario,
      password: hashedPassword,
      rol,
      id_sede,
    });

    await usuario.save();
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
  }
};

const obtenerUsuarios = async (_req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').populate('id_sede', 'nombre');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select('-password')
      .populate('id_sede', 'nombre');
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuario', error: error.message });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { password, passwordAntiguo, ...resto } = req.body;
    let datosActualizar = { ...resto };

    if (password) {
      if (!passwordAntiguo) {
        return res.status(400).json({ mensaje: 'Debe proporcionar la contraseña actual para cambiarla' });
      }

      const usuarioDb = await Usuario.findById(req.params.id);
      if (!usuarioDb) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      const esValida = await bcrypt.compare(passwordAntiguo, usuarioDb.password);
      if (!esValida) {
        return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
      }

      const salt = await bcrypt.genSalt(10);
      datosActualizar.password = await bcrypt.hash(password, salt);
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, datosActualizar, { new: true }).select('-password');
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    res.json({ mensaje: 'Usuario actualizado exitosamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario', error: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = { crearUsuario, obtenerUsuarios, obtenerUsuarioPorId, actualizarUsuario, eliminarUsuario };
