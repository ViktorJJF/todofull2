const mongoose = require('mongoose');

const { Schema } = mongoose;

const locacionesSchema = new Schema(
  {
    nombre: {
      type: String,
      unique: true,
      required: [true, 'El nombre de la locacion es requerido'],
    },
    description: String,
    status: {
      type: Boolean,
      default: true,
    },
    ciudad: String,
    pais: String,
    equipoDeVentaId: {
      type: Schema.Types.ObjectId,
      ref: 'EquiposDeVentas',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

//auto populate
var autoPopulateLead = function (next) {
  this.populate('equipoDeVentaId');
  next();
};
var autoPopulateLead2 = function (doc, next) {
  doc
    .populate('equipoDeVentaId')
    .execPopulate()
    .then(function () {
      next();
    });
};

locacionesSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
locacionesSchema.post('save', autoPopulateLead2);

module.exports = mongoose.model('Locaciones', locacionesSchema);
