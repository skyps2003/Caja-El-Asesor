const express = require('express');
const router = express.Router();
const cierreController = require('../controllers/cierreController');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// Rutas de Cierres y Reportes
router.get('/', verificarToken, cierreController.listarCierres);
router.get('/resumen/diario', verificarToken, cierreController.resumenDiario);
router.get('/resumen/mensual', verificarToken, cierreController.resumenMensual);
router.get('/previsualizar/sede', verificarToken, cierreController.previsualizarCierre);
router.get('/movimientos-periodo', verificarToken, cierreController.movimientosPeriodo);
router.post('/', verificarToken, verificarRol('CAJERO_SEDE'), cierreController.registrarCierre);

module.exports = router;