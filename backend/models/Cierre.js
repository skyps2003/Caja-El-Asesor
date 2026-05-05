const mongoose = require('mongoose');

const cierreSchema = new mongoose.Schema({
    id_sede: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sede',
        required: true
    },
    id_usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        enum: ['DIARIO', 'MENSUAL'],
        required: true
    },
    fecha_inicio: {
        type: Date,
        required: true
    },
    fecha_cierre: {
        type: Date,
        default: Date.now
    },
    saldo_apertura: {
        type: Number,
        required: true
    },
    total_ingresos: {
        type: Number,
        default: 0
    },
    total_egresos: {
        type: Number,
        default: 0
    },
    saldo_esperado: {
        type: Number,
        required: true
    },
    saldo_real: {
        type: Number,
        required: true
    },
    diferencia: {
        type: Number,
        default: 0
    },
    total_movimientos: {
        type: Number,
        default: 0
    },
    observaciones: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Cierre', cierreSchema);