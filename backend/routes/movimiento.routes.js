const router = require('express').Router();
const { crearMovimiento, obtenerMovimientos, obtenerMovimientosPorCaja } = require('../controllers/movimiento.controller');

router.post('/', crearMovimiento);
router.get('/', obtenerMovimientos);
router.get('/caja/:idCaja', obtenerMovimientosPorCaja);

module.exports = router;
