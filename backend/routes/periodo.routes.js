const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodo.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// ── Rutas de Períodos Mensuales ──────────────────────────────
// Obtener período mensual actual de una caja
router.get('/:id_caja', verificarToken, periodoController.obtenerPeriodoMensual);

// Cerrar período mensual
router.post('/:id_caja/cerrar', verificarToken, periodoController.cerrarPeriodoMensual);

// Obtener historial de períodos
router.get('/:id_caja/historial', verificarToken, periodoController.obtenerHistorialPeriodos);

module.exports = router;
