const mongoose = require('mongoose');
require('dotenv').config();
const Usuario = require('../models/Usuario');

const checkAdminStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await Usuario.findOne({ login_usuario: 'admin' });
    if (admin) {
      console.log('Admin status:', admin.estado);
      if (!admin.estado) {
        admin.estado = true;
        await admin.save();
        console.log('Admin enabled');
      }
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkAdminStatus();
