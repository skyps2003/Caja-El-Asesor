const router = require('express').Router();
const { crearCaja, obtenerCajas, obtenerCajasPorSede, obtenerCajaPorId, actualizarCaja, eliminarCaja } = require('../controllers/caja.controller');

router.post('/', crearCaja);
router.get('/', obtenerCajas);
router.get('/sede/:idSede', obtenerCajasPorSede);
router.get('/:id', obtenerCajaPorId);
router.put('/:id', actualizarCaja);
router.delete('/:id', eliminarCaja);

module.exports = router;
