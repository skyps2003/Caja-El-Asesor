/**
 * seed.js — Pobla la BD con datos iniciales:
 *   1. Sedes (Principal Abancay + Chalhuahuacho)
 *   2. Cajas por sede
 *   3. Usuario ADMINISTRADOR  → login: admin  |  password: ADMI 1234
 *
 * Uso: node scripts/seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Sede    = require('../models/Sede');
const Caja    = require('../models/Caja');
const Usuario = require('../models/Usuario');
const bcrypt  = require('bcryptjs');

// ── Datos ──────────────────────────────────────────────────────────────────

const sedesIniciales = [
  { nombre: 'Principal Abancay',  direccion: 'Abancay Centro' },
  { nombre: 'Chalhuahuacho',      direccion: 'Chalhuahuacho Centro' },
];

const cajasIniciales = [
  { codigo: '001', nombre_caja: 'Efectivo',           saldo_minimo: 0, saldo_maximo: 50000  },
  { codigo: '002', nombre_caja: 'Banco Continental',  saldo_minimo: 0, saldo_maximo: 100000 },
  { codigo: '003', nombre_caja: 'Interbank',          saldo_minimo: 0, saldo_maximo: 100000 },
  { codigo: '004', nombre_caja: 'Banco de la Nación', saldo_minimo: 0, saldo_maximo: 100000 },
  { codigo: '005', nombre_caja: 'Banco de Crédito',   saldo_minimo: 0, saldo_maximo: 100000 },
];

const ADMIN = {
  nombre:        'Administrador Principal',
  login_usuario: 'admin',
  password:      'ADMI 1234',
  rol:           'ADMINISTRADOR',
};

// ── Seed ───────────────────────────────────────────────────────────────────

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a la base de datos.\n');

    // 1. Sedes
    console.log('── Sedes ───────────────────────────────────────');
    let sedesCreadas = [];
    for (const s of sedesIniciales) {
      let sede = await Sede.findOne({ nombre: s.nombre });
      if (!sede) {
        sede = await Sede.create(s);
        console.log(`  ✚ Sede creada:    "${s.nombre}"`);
      } else {
        console.log(`  ✔ Sede existente: "${s.nombre}"`);
      }
      sedesCreadas.push(sede);
    }

    const sedePrincipal = sedesCreadas[0]; // Abancay

    // 2. Cajas (asignadas a la sede principal)
    console.log('\n── Cajas ───────────────────────────────────────');
    for (const c of cajasIniciales) {
      let caja = await Caja.findOne({ codigo: c.codigo });
      if (!caja) {
        await Caja.create({ ...c, id_sede: sedePrincipal._id });
        console.log(`  ✚ Caja creada:    "${c.nombre_caja}"`);
      } else {
        console.log(`  ✔ Caja existente: "${c.nombre_caja}"`);
      }
    }

    // 3. Administrador
    console.log('\n── Administrador ───────────────────────────────');
    const yaExiste = await Usuario.findOne({ login_usuario: ADMIN.login_usuario });
    if (yaExiste) {
      console.log(`  ✔ El usuario "${ADMIN.login_usuario}" ya existe. Sin cambios.`);
      console.log(`    Rol: ${yaExiste.rol} | Estado: ${yaExiste.estado ? 'Activo' : 'Inactivo'}`);
    } else {
      const hash = await bcrypt.hash(ADMIN.password, 10);
      const admin = await Usuario.create({
        nombre:        ADMIN.nombre,
        login_usuario: ADMIN.login_usuario,
        password:      hash,
        rol:           ADMIN.rol,
        id_sede:       sedePrincipal._id,
        estado:        true,
      });
      console.log(`  ✚ Admin creado:`);
      console.log(`    👤 Nombre:   ${admin.nombre}`);
      console.log(`    🔑 Login:    ${admin.login_usuario}`);
      console.log(`    🔒 Password: ${ADMIN.password}`);
      console.log(`    🏢 Sede:     ${sedePrincipal.nombre}`);
    }

    console.log('\n🎉 Seed completado correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
    process.exit(1);
  }
};

seedData();
