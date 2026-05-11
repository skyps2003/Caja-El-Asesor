const Sede = require('../models/Sede');

const crearSede = async (req, res) => {
  try {
    const sede = new Sede(req.body);
    await sede.save();
    res.status(201).json({ mensaje: 'Sede creada exitosamente', sede });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear sede', error: error.message });
  }
};

const obtenerSedes = async (_req, res) => {
  try {
    const sedes = await Sede.find();
    res.json(sedes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener sedes', error: error.message });
  }
};

const obtenerSedePorId = async (req, res) => {
  try {
    const sede = await Sede.findById(req.params.id);
    if (!sede) return res.status(404).json({ mensaje: 'Sede no encontrada' });
    res.json(sede);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener sede', error: error.message });
  }
};

const actualizarSede = async (req, res) => {
  try {
    const sede = await Sede.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!sede) return res.status(404).json({ mensaje: 'Sede no encontrada' });
    res.json({ mensaje: 'Sede actualizada', sede });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar sede', error: error.message });
  }
};

const eliminarSede = async (req, res) => {
  try {
    const sede = await Sede.findByIdAndDelete(req.params.id);
    if (!sede) return res.status(404).json({ mensaje: 'Sede no encontrada' });
    res.json({ mensaje: 'Sede eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar sede', error: error.message });
  }
};

module.exports = { crearSede, obtenerSedes, obtenerSedePorId, actualizarSede, eliminarSede };
