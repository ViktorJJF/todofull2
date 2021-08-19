const mongoose = require('mongoose');

const { Schema } = mongoose;

const productsSchema = new Schema(
  {
    erpId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Categories',
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brands',
    },
    details: [
      {
        price: String,
        country: String,
        urls: [],
      },
    ],
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

// mongoose.model('Products', productsSchema).syncIndexes();

module.exports = mongoose.model('Products', productsSchema);
