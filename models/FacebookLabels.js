const mongoose = require('mongoose');

const { Schema } = mongoose;

const facebookLabelsSchema = new Schema(
  {
    idLabel: {
      type: String,
      required: [true, 'El id de la etiqueta es requerido'],
    },
    name: String,
    todofullLabelId: {
      type: Schema.Types.ObjectId,
      ref: 'TodofullLabels',
    },
    foreignLabelId: String,
    source: String,
    customName: String,
    status: {
      type: Boolean,
      default: true,
    },
    fanpageId: String,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// auto populate
let autoPopulateLead = function (next) {
  this.populate('todofullLabelId');
  next();
};
let autoPopulateLead2 = function (doc, next) {
  doc
    .populate('todofullLabelId')
    .execPopulate()
    .then(() => {
      next();
    });
};

facebookLabelsSchema
  .pre('findOne', autoPopulateLead)
  .pre('find', autoPopulateLead);
facebookLabelsSchema.post('save', autoPopulateLead2);

mongoose.model('FacebookLabels', facebookLabelsSchema).syncIndexes();

module.exports = mongoose.model('FacebookLabels', facebookLabelsSchema);
