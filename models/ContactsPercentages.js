const mongoose = require('mongoose');

const { Schema } = mongoose;

const contactsPercentagesSchema = new Schema(
  {
    telefonoId: {
      type: Schema.Types.ObjectId,
      ref: 'Telefonos',
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    itemsExported: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    nextPageToken: String,
    error: Boolean,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model(
  'ContactsPercentage',
  contactsPercentagesSchema,
);
