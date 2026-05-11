const mongoose = require('mongoose');
require('dotenv').config();
const Usuario = require('../models/Usuario');

const fixUsername = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
    
    const result = await Usuario.findOneAndUpdate(
      { login_usuario: 'admi' },
      { login_usuario: 'admin' },
      { returnDocument: 'after' }
    );
    
    if (result) {
      console.log('Nombre de usuario cambiado de "admi" a "admin"');
    } else {
      console.log('Usuario "admi" no encontrado');
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUsername();
