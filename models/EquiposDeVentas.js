const mongoose = require('mongoose');

const { Schema } = mongoose;

const equiposDeVentasSchema = new Schema(
  {
    nombre: {
      type: String,
      unique: true,
      required: [true, 'El nombre del equipo de venta es requerido'],
    },
    description: String,
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model('EquiposDeVentas', equiposDeVentasSchema);
