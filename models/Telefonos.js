const mongoose = require('mongoose');

const { Schema } = mongoose;

const telefonosSchema = new Schema(
  {
    numero: {
      type: String,
      required: true,
    },
    googleContactEmail: {
      type: String,
      required: true,
    },
    credenciales: {
      clientId: String,
      clientSecret: String,
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      id_token: String,
      expiry_date: String,
    },
    agenteId: {
      type: Schema.Types.ObjectId,
      ref: 'Agentes',
    },
    labels: { type: Array, default: [] },
    active: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

//auto populate
var autoPopulateLead = function (next) {
  this.populate('agenteId');
  next();
};
var autoPopulateLead2 = function (doc, next) {
  doc
    .populate('agenteId')
    .execPopulate()
    .then(function () {
      next();
    });
};

telefonosSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
telefonosSchema.post('save', autoPopulateLead2);

mongoose.model('Telefonos', telefonosSchema).syncIndexes();

module.exports = mongoose.model('Telefonos', telefonosSchema);
