const mongoose = require('mongoose');

const { Schema } = mongoose;

const ecommercesAttributesSchema = new Schema(
  {
    idAttribute: {
      type: Number,
    },
    name: {
      type: String,
      required: [true, 'El nombre del atributo es requerido'],
    },
    terms: [
      new Schema({
        idTerm: {
          type: Number,
        },
        name: String,
        slug: String,
        description: String,
      }),
    ],
    woocommerceId: {
      type: Schema.Types.ObjectId,
      ref: 'Woocommerces',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// auto populate
var autoPopulateLead = function (next) {
  this.populate('woocommerceId');
  next();
};
var autoPopulateLead2 = function (doc, next) {
  doc
    .populate('woocommerceId')
    .execPopulate()
    .then(function () {
      next();
    });
};

ecommercesAttributesSchema
  .pre('findOne', autoPopulateLead)
  .pre('find', autoPopulateLead);
ecommercesAttributesSchema.post('save', autoPopulateLead2);

module.exports = mongoose.model(
  'EcommercesAttributes',
  ecommercesAttributesSchema,
);
