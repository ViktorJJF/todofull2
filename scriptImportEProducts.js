require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const Ecommerce = require('./models/Ecommerces');

let COUNTRY = 'Chile';
let BASE_URL = 'https://mujeron.cl';
const USERNAME = 'ck_78ff728bc20022062d377cc406914cfdd86da9fe';
const PASSWORD = 'cs_1173bfaafc6fb20753eb063d559af2d14f654296';
let buff = new Buffer(USERNAME + ':' + PASSWORD);
let base64data = buff.toString('base64');

(async () => {
  let products = [];
  try {
    let res = await axios({
      method: 'get',
      url: BASE_URL + '/wp-json/wc/v3/products?page=9&per_page=100',
      withCredentials: true,
      headers: {
        Authorization: 'Basic ' + base64data,
      },
    });
    let counter = 0;
    for (const productEcommerce of res.data) {
      let product = {
        idEcommerce: productEcommerce.id,
        name: productEcommerce.name,
        permalink: productEcommerce.permalink,
        date_created: productEcommerce.date_created,
        date_modified: productEcommerce.date_modified,
        type: productEcommerce.type,
        stock_status: productEcommerce.stock_status,
        status: productEcommerce.status, //publish
        catalog_visibility: productEcommerce.catalog_visibility,
        sku: productEcommerce.sku,
        regular_price: productEcommerce.regular_price,
        sale_price: productEcommerce.sale_price,
        related_ids: productEcommerce.related_ids,
        categories: productEcommerce.categories,
        related_ids: productEcommerce.related_ids,
        images: productEcommerce.images,
        attributes: productEcommerce.attributes,
        url: BASE_URL,
        country: COUNTRY,
      };
      let variations = await getVariations(productEcommerce.id);
      product['variations'] = variations;
      // console.log('pusheare el producto: ', new Ecommerce(product));
      products.push(product);
      await new Ecommerce(product).save();
      counter++;
      console.log('guardado! ' + counter);
    }
    console.log('res: ', res.data.length);
    // await Ecommerce.insertMany(products);
    console.log('hecho!');
  } catch (error) {
    console.log('error->', error);
  }
})();

async function getVariations(productId) {
  let res = await axios({
    method: 'get',
    url: BASE_URL + '/wp-json/wc/v3/products/' + productId + '/variations',
    withCredentials: true,
    headers: {
      Authorization: 'Basic ' + base64data,
    },
  });
  return res.data;
}
