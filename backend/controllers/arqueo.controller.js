const Arqueo = require('../models/Arqueo');
const Caja = require('../models/Caja');

const crearArqueo = async (req, res) => {
  try {
    const { id_sede, id_usuario, saldo_fisico, observaciones } = req.body;

    // Calcular saldo del sistema sumando los saldos de todas las cajas de la sede
    const cajas = await Caja.find({ id_sede });
    const saldo_sistema = cajas.reduce((acc, caja) => acc + caja.saldo_actual, 0);

    const diferencia = saldo_fisico - saldo_sistema;

    let estado;
    if (diferencia === 0) estado = 'CUADRADO';
    else if (diferencia > 0) estado = 'SOBRANTE';
    else estado = 'FALTANTE';

    const arqueo = new Arqueo({
      fecha_hora: new Date(),
      id_sede,
      id_usuario,
      saldo_sistema,
      saldo_fisico,
      diferencia,
      estado,
      observaciones,
    });

    await arqueo.save();
    res.status(201).json({ mensaje: 'Arqueo registrado exitosamente', arqueo });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear arqueo', error: error.message });
  }
};

const obtenerArqueos = async (_req, res) => {
  try {
    const arqueos = await Arqueo.find()
      .populate('id_sede', 'nombre')
      .populate('id_usuario', 'login_usuario')
      .sort({ fecha_hora: -1 });
    res.json(arqueos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener arqueos', error: error.message });
  }
};

const obtenerArqueosPorSede = async (req, res) => {
  try {
    const arqueos = await Arqueo.find({ id_sede: req.params.idSede })
      .populate('id_sede', 'nombre')
      .populate('id_usuario', 'login_usuario')
      .sort({ fecha_hora: -1 });
    res.json(arqueos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener arqueos', error: error.message });
  }
};

module.exports = { crearArqueo, obtenerArqueos, obtenerArqueosPorSede };
