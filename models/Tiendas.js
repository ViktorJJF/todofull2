const mongoose = require('mongoose');

const { Schema } = mongoose;

const tiendasSchema = new Schema(
  {
    nombre: {
      type: String,
      unique: true,
      required: [true, 'El nombre de la tienda es requerido'],
    },
    telefono: [],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model('Tiendas', tiendasSchema);
