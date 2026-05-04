const Caja = require('../models/Caja');

const Sede = require('../models/Sede');

const crearCaja = async (req, res) => {
  try {
    const { id_sede, ...restoData } = req.body;

    if (id_sede === 'todas') {
      const sedes = await Sede.find();
      const cajasAInsertar = sedes.map(sede => ({
        ...restoData,
        id_sede: sede._id
      }));
      await Caja.insertMany(cajasAInsertar);
      return res.status(201).json({ mensaje: 'Cajas creadas exitosamente en todas las sedes' });
    }

    const caja = new Caja(req.body);
    await caja.save();
    res.status(201).json({ mensaje: 'Caja creada exitosamente', caja });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear caja', error: error.message });
  }
};

const obtenerCajas = async (_req, res) => {
  try {
    const cajas = await Caja.find().populate('id_sede', 'nombre');
    res.json(cajas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cajas', error: error.message });
  }
};

const obtenerCajasPorSede = async (req, res) => {
  try {
    const cajas = await Caja.find({ id_sede: req.params.idSede }).populate('id_sede', 'nombre');
    res.json(cajas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cajas', error: error.message });
  }
};

const obtenerCajaPorId = async (req, res) => {
  try {
    const caja = await Caja.findById(req.params.id).populate('id_sede', 'nombre');
    if (!caja) return res.status(404).json({ mensaje: 'Caja no encontrada' });
    res.json(caja);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener caja', error: error.message });
  }
};

const actualizarCaja = async (req, res) => {
  try {
    const caja = await Caja.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!caja) return res.status(404).json({ mensaje: 'Caja no encontrada' });
    res.json({ mensaje: 'Caja actualizada', caja });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar caja', error: error.message });
  }
};

const eliminarCaja = async (req, res) => {
  try {
    const caja = await Caja.findByIdAndDelete(req.params.id);
    if (!caja) return res.status(404).json({ mensaje: 'Caja no encontrada' });
    res.json({ mensaje: 'Caja eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar caja', error: error.message });
  }
};

module.exports = { crearCaja, obtenerCajas, obtenerCajasPorSede, obtenerCajaPorId, actualizarCaja, eliminarCaja };
