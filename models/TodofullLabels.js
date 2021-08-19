const mongoose = require('mongoose');

const { Schema } = mongoose;

const todoFullLabelsSchema = new Schema(
  {
    name: String,
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

module.exports = mongoose.model('TodofullLabels', todoFullLabelsSchema);
