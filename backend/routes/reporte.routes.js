const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// ── Rutas de Reportes Excel ──────────────────────────────────
// Generar reporte mensual
router.post('/mensual', verificarToken, reporteController.generarReporteMensual);

// Generar reporte general de caja
router.post('/general', verificarToken, reporteController.generarReporteGeneral);

module.exports = router;
