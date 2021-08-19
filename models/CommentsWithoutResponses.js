const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    url: {
      type: String,
      unique: true,
      required: true,
    },
    fanpageId: String,
    err: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model('CommentsWithoutResponses', schema);
