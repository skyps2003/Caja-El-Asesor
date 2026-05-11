const mongoose = require('mongoose');
require('dotenv').config();
const Usuario = require('../models/Usuario');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
    const usuarios = await Usuario.find({}, 'login_usuario rol');
    console.log('Usuarios encontrados:', usuarios);
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();
