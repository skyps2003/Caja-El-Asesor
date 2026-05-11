const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Usuario = require('../models/Usuario');

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const result = await Usuario.findOneAndUpdate(
      { login_usuario: 'admi' },
      { password: hashedPassword },
      { new: true }
    );
    
    if (result) {
      console.log('Password para "admi" reseteado a "admin123"');
    } else {
      console.log('Usuario "admi" no encontrado');
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetPassword();
