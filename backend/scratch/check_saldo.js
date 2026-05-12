const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/Practicas/Caja/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const cajas = await mongoose.connection.db.collection('cajas').find().toArray();
  const total = cajas.reduce((acc, c) => acc + (c.saldo_actual || 0), 0);
  console.log('Total saldo_actual en cajas:', total);
  
  const movimientos = await mongoose.connection.db.collection('movimientos').find().toArray();
  console.log('Cantidad de movimientos:', movimientos.length);
  
  await mongoose.disconnect();
}
run();
