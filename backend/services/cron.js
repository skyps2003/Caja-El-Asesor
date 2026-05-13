const cron = require('node-cron');
const Cierre = require('../models/Cierre');
const Movimiento = require('../models/Movimiento');
const Caja = require('../models/Caja');
const Sede = require('../models/Sede');
const Usuario = require('../models/Usuario');

const initCron = () => {
  // Se cierra la caja a las 23:59 todos los días
  cron.schedule('59 23 * * *', async () => {
    console.log('Iniciando cierre diario automático de todas las sedes...');
    
    try {
      const sedes = await Sede.find();
      const adminSystem = await Usuario.findOne({ rol: 'ADMINISTRADOR' });
      
      if (!adminSystem) {
        console.error('No se encontró un administrador para realizar el cierre automático');
        return;
      }

      for (const sede of sedes) {
        try {
          const cajas = await Caja.find({ id_sede: sede._id }).select('_id saldo_actual');
          const cajaIds = cajas.map(c => c._id);

          const ultimoCierre = await Cierre.findOne({ id_sede: sede._id }).sort({ fecha_cierre: -1 });
          const fechaInicio = ultimoCierre ? ultimoCierre.fecha_cierre : new Date(0);
          const saldoApertura = ultimoCierre ? ultimoCierre.saldo_real : 0;

          const movimientos = await Movimiento.find({
            id_caja: { $in: cajaIds },
            fecha_hora: { $gt: fechaInicio },
          });

          if (movimientos.length === 0) {
            console.log(`Sede ${sede.nombre}: Sin movimientos pendientes, omitiendo cierre.`);
            continue;
          }

          let total_ingresos = 0;
          let total_egresos = 0;
          movimientos.forEach((mov) => {
            if (!mov.tipo) total_ingresos += mov.monto;
            else total_egresos += mov.monto;
          });

          const saldo_esperado = saldoApertura + total_ingresos - total_egresos;
          const saldo_real = cajas.reduce((acc, c) => acc + (c.saldo_actual || 0), 0);
          const diferencia = saldo_real - saldo_esperado;

          await Cierre.create({
            id_sede: sede._id,
            id_usuario: adminSystem._id,
            tipo: 'DIARIO',
            fecha_inicio: fechaInicio,
            saldo_apertura: saldoApertura,
            total_ingresos,
            total_egresos,
            saldo_esperado,
            saldo_real,
            diferencia,
            total_movimientos: movimientos.length,
            observaciones: 'Cierre diario automático del sistema (23:59)',
          });

          console.log(`Cierre diario automático completado para sede: ${sede.nombre}`);
        } catch (error) {
          console.error(`Error al cerrar sede ${sede.nombre}:`, error);
        }
      }
    } catch (error) {
      console.error('Error general en el cron de cierre diario:', error);
    }
  }, {
    timezone: "America/Lima"
  });
};

module.exports = initCron;
