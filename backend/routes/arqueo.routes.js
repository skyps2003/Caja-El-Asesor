const router = require('express').Router();
const { crearArqueo, obtenerArqueos, obtenerArqueosPorSede } = require('../controllers/arqueo.controller');

router.post('/', crearArqueo);
router.get('/', obtenerArqueos);
router.get('/sede/:idSede', obtenerArqueosPorSede);

module.exports = router;
