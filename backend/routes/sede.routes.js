const router = require('express').Router();
const { crearSede, obtenerSedes, obtenerSedePorId, actualizarSede, eliminarSede } = require('../controllers/sede.controller');

router.post('/', crearSede);
router.get('/', obtenerSedes);
router.get('/:id', obtenerSedePorId);
router.put('/:id', actualizarSede);
router.delete('/:id', eliminarSede);

module.exports = router;
