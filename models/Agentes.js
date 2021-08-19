const mongoose = require('mongoose');

const { Schema } = mongoose;

const agentesSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del agente es requerido'],
    },
    apellido: String,
    email: {
      type: String,
      required: [true, 'El email es necesario'],
    },
    locacionId: {
      type: Schema.Types.ObjectId,
      ref: 'Locaciones',
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

// auto populate
var autoPopulateLead = function (next) {
  this.populate('locacionId');
  next();
};
var autoPopulateLead2 = function (doc, next) {
  doc
    .populate('locacionId')
    .execPopulate()
    .then(function () {
      next();
    });
};

agentesSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
agentesSchema.post('save', autoPopulateLead2);

module.exports = mongoose.model('Agentes', agentesSchema);
