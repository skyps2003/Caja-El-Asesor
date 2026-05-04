const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Sede    = require('./models/Sede');
const Usuario = require('./models/Usuario');
const Caja    = require('./models/Caja');

// ═══════════════════════════════════════════════════════════════
//  LOS 5 TIPOS DE CAJA FIJOS DEL SISTEMA
//  Cada Sede recibe EXACTAMENTE estos 5 tipos al ser creada
// ═══════════════════════════════════════════════════════════════
const TIPOS_DE_CAJA = [
  { codigo: '001', nombre_caja: 'Efectivo',           saldo_minimo: 500,  saldo_maximo: 10000,  saldo_actual: 2000 },
  { codigo: '002', nombre_caja: 'Banco Continental',  saldo_minimo: 0,    saldo_maximo: 100000, saldo_actual: 15000 },
  { codigo: '003', nombre_caja: 'Interbank',          saldo_minimo: 0,    saldo_maximo: 100000, saldo_actual: 8000 },
  { codigo: '004', nombre_caja: 'Banco de la Nación', saldo_minimo: 0,    saldo_maximo: 100000, saldo_actual: 5000 },
  { codigo: '005', nombre_caja: 'Banco de Crédito',   saldo_minimo: 0,    saldo_maximo: 100000, saldo_actual: 12000 },
];

// Función que genera los 5 cajas para una sede específica
const generarCajasDeSede = (idSede, nombreSede) =>
  TIPOS_DE_CAJA.map((tipo) => ({
    id_sede: idSede,
    codigo:     `${nombreSede.substring(0, 3).toUpperCase()}-${tipo.codigo}`, // Ej: SED-001, ABA-001
    nombre_caja: tipo.nombre_caja,
    saldo_minimo: tipo.saldo_minimo,
    saldo_maximo: tipo.saldo_maximo,
    saldo_actual: tipo.saldo_actual,
  }));

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado para seed...');

    // ── Limpiar colecciones ───────────────────────────────────
    await Sede.deleteMany({});
    await Usuario.deleteMany({});
    await Caja.deleteMany({});
    console.log('🧹 Colecciones limpiadas.');

    // ── Crear Sedes ───────────────────────────────────────────
    const sedes = await Sede.insertMany([
      { nombre: 'Sede Principal',  direccion: 'Av. Principal 100, Lima',       estado: true },
      { nombre: 'Sede Abancay',    direccion: 'Jr. Lima 250, Abancay',         estado: true },
      { nombre: 'Sede Chalhuacho', direccion: 'Av. Minera 50, Chalhuacho',     estado: true },
    ]);

    const [sedePrincipal, sedeAbancay, sedeChalhuacho] = sedes;
    console.log('🏢 Sedes creadas:', sedes.map((s) => s.nombre).join(', '));

    // ── Crear Usuarios ────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);

    await Usuario.insertMany([
      {
        nombre:        'Juan Admin',
        login_usuario: 'admi@elasesor.com',
        password:      await bcrypt.hash('admin1234', salt),
        rol:           'ADMINISTRADOR',
        id_sede:       sedePrincipal._id,
        estado:        true,
      },
      {
        nombre:        'Ana',
        login_usuario: 'abancay@elasesor.com',
        password:      await bcrypt.hash('abancay1234', salt),
        rol:           'CAJERO_SEDE',
        id_sede:       sedeAbancay._id,
        estado:        true,
      },
      {
        nombre:        'Rosa',
        login_usuario: 'chalhuacho@elasesor.com',
        password:      await bcrypt.hash('chalhuacho1234', salt),
        rol:           'CAJERO_SEDE',
        id_sede:       sedeChalhuacho._id,
        estado:        true,
      },
    ]);

    console.log('👤 Usuarios creados:');
    console.log('   Juan Admin (admi@elasesor.com)         -> ADMINISTRADOR -> Sede Principal');
    console.log('   Ana (abancay@elasesor.com)             -> CAJERO_SEDE   -> Sede Abancay');
    console.log('   Rosa (chalhuacho@elasesor.com)         -> CAJERO_SEDE   -> Sede Chalhuacho');

    // ── Crear 5 Cajas por cada Sede (= 15 cajas en total) ────
    const todasLasCajas = [
      ...generarCajasDeSede(sedePrincipal._id, 'SED'),
      ...generarCajasDeSede(sedeAbancay._id,   'ABA'),
      ...generarCajasDeSede(sedeChalhuacho._id, 'CHL'),
    ];

    const cajasCreadas = await Caja.insertMany(todasLasCajas);
    console.log(`\n💰 ${cajasCreadas.length} Cajas creadas (5 tipos por cada sede):`);
    console.log('   001 - Efectivo');
    console.log('   002 - Banco Continental');
    console.log('   003 - Interbank');
    console.log('   004 - Banco de la Nación');
    console.log('   005 - Banco de Crédito');

    console.log('\n════════════════════════════════════════');
    console.log('   SEED COMPLETADO EXITOSAMENTE');
    console.log('════════════════════════════════════════');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Juan Admin (Admin):   admi@elasesor.com / admin1234');
    console.log('   Ana (Abancay):        abancay@elasesor.com / abancay1234');
    console.log('   Rosa (Chalhuacho):    chalhuacho@elasesor.com / chalhuacho1234');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedDB();
