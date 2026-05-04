const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Conexion a MongoDB Atlas ────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado exitosamente'))
  .catch((err) => console.error('Error de conexion a MongoDB:', err));

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/sedes', require('./routes/sede.routes'));
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/cajas', require('./routes/caja.routes'));
app.use('/api/movimientos', require('./routes/movimiento.routes'));
app.use('/api/arqueos', require('./routes/arqueo.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

// ── Ruta raiz de verificacion ───────────────────────────────
app.get('/', (_req, res) => {
  res.json({ mensaje: 'API Sistema de Gestion de Cajas Distribuido activa' });
});

// ── Iniciar servidor ────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
