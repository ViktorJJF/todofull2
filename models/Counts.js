const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    leadSinAsignarCount: {},
    leadReconectarCount: {},
  },
  {
    versionKey: false,
    timestamps: true,
    // toJSON: { virtuals: true },
  },
);

mongoose.model('Counts', schema).syncIndexes();

module.exports = mongoose.model('Counts', schema);
