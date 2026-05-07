const router = require('express').Router();
const { crearMovimiento, obtenerMovimientos, obtenerMovimientosPorCaja, actualizarEstadoMovimiento } = require('../controllers/movimiento.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.post('/', verificarToken, verificarRol('CAJERO_SEDE'), crearMovimiento);
router.get('/', verificarToken, obtenerMovimientos);
router.get('/caja/:idCaja', verificarToken, obtenerMovimientosPorCaja);
router.put('/:id/estado', verificarToken, verificarRol('ADMINISTRADOR'), actualizarEstadoMovimiento);

module.exports = router;
