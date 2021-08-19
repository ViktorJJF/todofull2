const mongoose = require('mongoose');

const { Schema } = mongoose;

const contactosSchema = new Schema(
  {
    celular: {
      type: String,
      // required: true,
    },
    telefono: String,
    displayName: String,
    nombre: String,
    segundoNombre: String,
    apellido: String,
    email: String,
    resourceName: { type: String, unique: true },
    telefonoId: {
      type: Schema.Types.ObjectId,
      ref: 'Telefonos',
    },
    etag: String,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

//auto populate
var autoPopulateLead = function (next) {
  this.populate('telefonoId');
  next();
};
var autoPopulateLead2 = function (doc, next) {
  doc
    .populate('telefonoId')
    .execPopulate()
    .then(function () {
      next();
    });
};

contactosSchema.index(
  { celular: 1, email: 1, telefonoId: 1, resourceName: 1 },
  { unique: true },
);

contactosSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
contactosSchema.post('save', autoPopulateLead2);

const model = mongoose.model('Contactos', contactosSchema);

model.syncIndexes();
module.exports = model;
