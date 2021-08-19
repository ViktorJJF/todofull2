const mongoose = require('mongoose');

const { Schema } = mongoose;

const ecommercesSchema = new Schema(
  {
    idEcommerce: {
      type: Number,
    },
    woocommerceId: {
      type: Schema.Types.ObjectId,
      ref: 'Woocommerces',
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
    },
    ref: String,
    permalink: String,
    date_created: Date,
    date_modified: Date,
    type: String,
    status: String, //publish
    stock_status: {
      type: String,
      default: '',
    },
    catalog_visibility: String,
    sku: String,
    regular_price: Number,
    sale_price: Number,
    related_ids: [],
    categories: [{ id: String, name: String }],
    related_ids: [],
    images: [{ _id: false, id: String, src: String, alt: String }],
    attributes: [{ id: String, name: String, variation: Boolean, options: [] }],
    url: String,
    country: {
      type: String,
      enum: {
        values: ['Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país de Ecommerce válido',
      },
      default: 'Peru',
    },
    variations: [
      {
        _id: false,
        stock_status: String,
        status: String,
        date_modified: Date,
        regular_price: Number,
        sale_price: Number,
      },
    ],
    customImage: { type: String }, // en formato URL
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

mongoose.model('Ecommerces', ecommercesSchema).syncIndexes();

module.exports = mongoose.model('Ecommerces', ecommercesSchema);
