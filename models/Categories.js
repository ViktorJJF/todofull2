const mongoose = require('mongoose');

const { Schema } = mongoose;

const categoriesSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'El nombre de la categoría es requerido'],
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

module.exports = mongoose.model('Categories', categoriesSchema);
