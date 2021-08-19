const mongoose = require('mongoose');

const { Schema } = mongoose;

const ecommercesTags = new Schema(
  {
    idTag: {
      type: Number,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la etiqueta es requerido'],
    },
    slug: String,
    webpage: String,
    url: String,
    country: String,
    count: Number,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// mongoose.model('EcommercesCategories', ecommercesTags).syncIndexes();

module.exports = mongoose.model('EcommercesTags', ecommercesTags);
