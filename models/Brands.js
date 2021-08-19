const mongoose = require('mongoose');

const { Schema } = mongoose;

const brandsSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'El nombre de la marca es requerido'],
    },
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

module.exports = mongoose.model('Brands', brandsSchema);
