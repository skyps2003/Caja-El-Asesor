const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const login = async (req, res) => {
  try {
    const { login_usuario, password } = req.body;

    const usuario = await Usuario.findOne({ login_usuario }).populate('id_sede', 'nombre');
    if (!usuario) {
      console.log(`Login fallido: Usuario "${login_usuario}" no encontrado`);
      return res.status(401).json({ mensaje: 'El usuario ingresado no existe.' });
    }

    if (!usuario.estado) {
      console.log(`Login fallido: Usuario "${login_usuario}" deshabilitado`);
      return res.status(403).json({ mensaje: 'El usuario se encuentra deshabilitado.' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      console.log(`Login fallido: Contraseña incorrecta para "${login_usuario}"`);
      return res.status(401).json({ mensaje: 'La contraseña es incorrecta.' });
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        nombre: usuario.nombre,
        login_usuario: usuario.login_usuario,
        rol: usuario.rol,
        id_sede: usuario.id_sede,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        login_usuario: usuario.login_usuario,
        rol: usuario.rol,
        id_sede: usuario.id_sede,
        avatar: usuario.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el login', error: error.message });
  }
};

module.exports = { login };
