const express = require('express');
const router = express.Router();
const comprobanteController = require('../controllers/comprobante.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// ── Rutas de Comprobantes Pendientes ───────────────────────
// Solicitar un nuevo comprobante
router.post('/solicitar', verificarToken, comprobanteController.solicitarComprobante);

// Obtener comprobantes pendientes
router.get('/pendientes', verificarToken, comprobanteController.obtenerComprobantesPendientes);

// Aprobar solicitud de comprobante
router.put('/:id_comprobante/aprobar', verificarToken, comprobanteController.aprobarComprobante);

// Rechazar solicitud de comprobante
router.put('/:id_comprobante/rechazar', verificarToken, comprobanteController.rechazarComprobante);

// Asignar número de comprobante a movimiento
router.put('/movimiento/:id_movimiento/asignar', verificarToken, comprobanteController.asignarComprobanteAMovimiento);

// Obtener movimientos sin comprobante asignado
router.get('/movimientos/sin-comprobante', verificarToken, comprobanteController.obtenerMovimientosSinComprobante);

module.exports = router;
