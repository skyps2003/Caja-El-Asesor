const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/Practicas/Caja/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (let c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`${c.name}: ${count}`);
  }
  
  const cajas = await mongoose.connection.db.collection('cajas').find().toArray();
  const sedes = await mongoose.connection.db.collection('sedes').find().toArray();
  const usuarios = await mongoose.connection.db.collection('usuarios').find().toArray();
  
  console.log('Cajas:');
  cajas.forEach(c => console.log(c));
  
  await mongoose.disconnect();
}
run();
