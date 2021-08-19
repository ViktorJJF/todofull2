const mongoose = require('mongoose');

const { Schema } = mongoose;

const contactCenterSchema = new Schema(
  {
    nombre: {
      type: String,
      unique: true,
      required: [true, 'El nombre del contact center es requerido'],
    },
    telefono: [],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model('ContactCenters', contactCenterSchema);
