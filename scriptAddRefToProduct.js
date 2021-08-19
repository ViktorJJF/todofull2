require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const Ecommerce = require('./models/Ecommerces');

(async () => {
  console.log(await Ecommerce.find());
  let products = await Ecommerce.find();
  for (const product of products) {
    product.ref = getProductRef(product.name);
    await product.save();
    console.log('producto actualizado!');
  }
  console.log('terminado todo!');
})();

function getProductRef(productName) {
  console.log('el match: ', productName.match(/-*([0-9]-*){1,}/g));
  let numberRefs = productName.match(/-*([0-9]-*){1,}/g) || [];
  if (numberRefs.length > 0) return numberRefs[0];
  else
    productName = productName
      .toLowerCase()
      .replace('jeans', '')
      .replace('jean', '')
      .replace('colombiano', '')
      .replace('colombianos', '')
      .replace('pushup', '')
      .replace('pushups', '')
      .replace('push up', '')
      .replace('levantacola', '')
      .replace('levanta cola', '')
      .replace('tyt', '')
      .replace('t&T', '')
      .replace('real', '')
      .replace('Asi sea', '')
      .replace('asi sea', '')
      .replace('asisea', '')
      .replace('forlux', '')
      .replace('Cheviotto', '')
      .replace('cheviotto', '')
      .replace('T&amp;T', '')
      .replace('t&amp;t', '')
      .replace('t&amp;t', '')
      .replace('body', '')
      .replace('reductor', '')
      .replace('colombiano', '')
      .replace('ideal', '')
      .replace('pantalón', '')
      .replace('pantalon', '')
      .replace('eco-cuero', '')
      .replace('colombiana', '')
      .trim()
      .toUpperCase();
  return productName;
}
