require('dotenv-safe').config();
const initMongo = require('../config/mongo');

initMongo();

// models
// const Products = require('../models/Products');

// (async () => {
//   const products = await Products.find({});
//   console.log('los produyctos: ', products);
//   let temporary;
//   for (const product of products) {
//     temporary = product.price;
//     product.price = product.purchasePrice;
//     product.purchasePrice = temporary;
//     product.save();
//     console.log('guardado prro');
//   }
// })();
