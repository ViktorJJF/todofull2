const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    apiKey: {
      type: String,
      required: [true, 'La apiKey es necesaria'],
    },
    server: {
      type: String,
      required: [true, 'El servidor es necesario'],
    },
    country: {
      type: String,
      enum: {
        values: ['Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país válido',
      },
      required: [true, 'El país es necesario'],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model('Mailchimps', schema);
