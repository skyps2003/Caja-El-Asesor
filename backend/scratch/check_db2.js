const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/Practicas/Caja/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const cajas = await mongoose.connection.db.collection('cajas').find().toArray();
  const sedes = await mongoose.connection.db.collection('sedes').find().toArray();
  const usuarios = await mongoose.connection.db.collection('usuarios').find().toArray();
  
  console.log('--- CAJAS ---');
  cajas.forEach(c => console.log(`${c.nombre_caja} (${c.codigo}): ${c.saldo_actual}`));
  
  console.log('--- SEDES ---');
  sedes.forEach(s => console.log(`${s.nombre} - ${s.direccion}`));
  
  console.log('--- USUARIOS ---');
  usuarios.forEach(u => console.log(`${u.correo} - ${u.rol}`));

  // Delete all? The user says "si no hay ya nada lo borre y sigue saliendo eso". 
  // It means they want me to delete it if it's there. 
  // Let me just check first.
  
  await mongoose.disconnect();
}
run();
