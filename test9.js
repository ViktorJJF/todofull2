/**
 * Sincronizar productos
 */
const extractDomain = require('extract-domain');
require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const Ecommerce = require('./models/Ecommerces');
const Woocommerce = require('./models/Woocommerces');
(async () => {
  let products = await Ecommerce.find();
  console.log('los productos: ', products);
  for (const product of products) {
    try {
      console.log('el producto: ', product.idEcommerce);
      let variation = await getVariations(product.idEcommerce, product.url);
      console.log('la variacion: ', variation);
      product.variations = variation;
      product.save();
    } catch (error) {
      console.log('un error: ', error);
    }
  }
  console.log('fin!!');
})();

async function getVariations(productId, sourceUrl) {
  let BASE_URL, USERNAME, PASSWORD, buff, base64data;
  //se obtienen las credenciales para hacer la consulta a woocommerce
  let credential = await getCredential(sourceUrl);
  BASE_URL = getUrl(sourceUrl);
  USERNAME = credential.consumerKey;
  PASSWORD = credential.consumerSecret;
  buff = new Buffer(USERNAME + ':' + PASSWORD);
  base64data = buff.toString('base64');
  let res;
  try {
    res = await axios({
      method: 'get',
      url: BASE_URL + '/wp-json/wc/v3/products/' + productId + '/variations',
      withCredentials: true,
      headers: {
        Authorization: 'Basic ' + base64data,
      },
    });
  } catch (error) {
    console.log('error 1: ', error);
  }
  return res.data;
}

async function getCredential(domain) {
  let credentials = await Woocommerce.find();
  return credentials.find(
    (woocommerce) => extractDomain(woocommerce.domain) == extractDomain(domain),
  );
}

function getUrl(text) {
  return 'https://' + extractDomain(text);
}

function getCountryFromUrl(url) {
  if (url.includes('.cl')) {
    return 'Chile';
  } else if (url.includes('.pe')) {
    return 'Peru';
  } else {
    return 'Colombia';
  }
}
