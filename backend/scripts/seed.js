const mongoose = require('mongoose');
require('dotenv').config();
const Sede = require('../models/Sede');
const Caja = require('../models/Caja');

const sedesIniciales = [
  { nombre: 'Principal Abancay', direccion: 'Abancay Centro' },
  { nombre: 'Chalhuahuacho', direccion: 'Chalhuahuacho Centro' }
];

const cajasIniciales = [
  { codigo: '001', nombre_caja: 'Efectivo', saldo_minimo: 0, saldo_maximo: 50000 },
  { codigo: '002', nombre_caja: 'Banco continental', saldo_minimo: 0, saldo_maximo: 100000 },
  { codigo: '003', nombre_caja: 'interbank', saldo_minimo: 0, saldo_maximo: 100000 },
  { codigo: '004', nombre_caja: 'banco de la nacion', saldo_minimo: 0, saldo_maximo: 100000 },
  { codigo: '005', nombre_caja: 'banco de credito', saldo_minimo: 0, saldo_maximo: 100000 }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a la base de datos.');

    // 1. Poblar Sedes
    let sedesCreadas = [];
    for (const s of sedesIniciales) {
      let sede = await Sede.findOne({ nombre: s.nombre });
      if (!sede) {
        sede = new Sede(s);
        await sede.save();
        console.log(`Sede ${s.nombre} creada.`);
      } else {
        console.log(`Sede ${s.nombre} ya existe.`);
      }
      sedesCreadas.push(sede);
    }

    const sedePrincipal = sedesCreadas[0]; // Usar la primera sede (Abancay) para asignar las cajas

    // 2. Poblar Cajas para la sede principal
    for (const c of cajasIniciales) {
      let caja = await Caja.findOne({ codigo: c.codigo });
      if (!caja) {
        caja = new Caja({ ...c, id_sede: sedePrincipal._id });
        await caja.save();
        console.log(`Caja ${c.nombre_caja} creada.`);
      } else {
        console.log(`Caja ${c.nombre_caja} ya existe.`);
      }
    }

    console.log('Seed terminado.');
    process.exit();
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  }
};

seedData();
