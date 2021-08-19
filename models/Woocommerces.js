const mongoose = require('mongoose');

const { Schema } = mongoose;

const woocommercesSchema = new Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
    },
    consumerKey: String,
    consumerSecret: String,
    telefonoId: {
      type: Schema.Types.ObjectId,
      ref: 'Telefonos',
    },
    country: {
      type: String,
      enum: {
        values: ['PERU', 'Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país de MUJERON válido',
      },
      default: 'Peru',
    },
  },
  {
    versionKey: false,
    timestamps: true,
    // toJSON: { virtuals: true },
  },
);

// woocommercesSchema.virtual('agente', {
//   ref: 'Agentes',
//   localField: 'telefonoId',
//   foreignField: '_id',
//   justOne: true,
// });

// auto populate
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

woocommercesSchema
  .pre('findOne', autoPopulateLead)
  .pre('find', autoPopulateLead);
woocommercesSchema.post('save', autoPopulateLead2);

mongoose.model('Woocommerces', woocommercesSchema).syncIndexes();

module.exports = mongoose.model('Woocommerces', woocommercesSchema);
