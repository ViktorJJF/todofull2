const mongoose = require('mongoose');

const { Schema } = mongoose;

const ecommercesCategoriesSchema = new Schema(
  {
    idCategory: {
      type: Number,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es requerida'],
    },
    slug: String,
    parent: Number,
    menu_order: Number,
    url: String,
    country: String,
    date_modified: Date,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// mongoose.model('EcommercesCategories', ecommercesCategoriesSchema).syncIndexes();

module.exports = mongoose.model(
  'EcommercesCategories',
  ecommercesCategoriesSchema,
);
