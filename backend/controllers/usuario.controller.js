const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const crearUsuario = async (req, res) => {
  try {
    const { nombre, login_usuario, password, rol, id_sede } = req.body;

    const escapedLogin = login_usuario.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existente = await Usuario.findOne({ 
      login_usuario: { $regex: new RegExp(`^${escapedLogin}$`, 'i') } 
    });
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
    const { id } = req.params;

    // Verificar permisos: Admin puede todo, otros solo a sí mismos
    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.id !== id) {
      return res.status(403).json({ mensaje: 'No tienes permisos para actualizar este perfil' });
    }

    // Si no es admin, protegemos campos sensibles
    if (req.usuario.rol !== 'ADMINISTRADOR') {
      delete resto.rol;
      delete resto.id_sede;
      delete resto.estado;
      delete resto.login_usuario; // No permitimos cambiar el login a cajeros por seguridad
    }

    let datosActualizar = { ...resto };

    if (password) {
      if (!passwordAntiguo) {
        return res.status(400).json({ mensaje: 'Debe proporcionar la contraseña actual para cambiarla' });
      }

      const usuarioDb = await Usuario.findById(id);
      if (!usuarioDb) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      const esValida = await bcrypt.compare(passwordAntiguo, usuarioDb.password);
      if (!esValida) {
        return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
      }

      const salt = await bcrypt.genSalt(10);
      datosActualizar.password = await bcrypt.hash(password, salt);
    }

    const usuario = await Usuario.findByIdAndUpdate(id, datosActualizar, { returnDocument: 'after' })
      .select('-password')
      .populate('id_sede', 'nombre');

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    res.json({ mensaje: 'Perfil actualizado exitosamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const usuarioAEliminar = await Usuario.findById(req.params.id);
    if (!usuarioAEliminar) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    // Restricción: No se pueden eliminar administradores
    if (usuarioAEliminar.rol === 'ADMINISTRADOR') {
      return res.status(400).json({ mensaje: 'No se permite eliminar usuarios con el nivel de acceso ADMINISTRADOR.' });
    }

    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
  }
};

const actualizarAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se subió ninguna imagen' });
    }

    const { id } = req.params;

    // Verificar permisos
    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.id !== id) {
      return res.status(403).json({ mensaje: 'No tienes permisos para actualizar este perfil' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { avatar: avatarUrl },
      { returnDocument: 'after' }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Avatar actualizado con éxito',
      avatar: avatarUrl,
      usuario
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar avatar', error: error.message });
  }
};

module.exports = { crearUsuario, obtenerUsuarios, obtenerUsuarioPorId, actualizarUsuario, eliminarUsuario, actualizarAvatar };
