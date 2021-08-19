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
  for (const product of products) {
    try {
      let responses = await Promise.all([
        getProductWoocommerce(product.idEcommerce, product.url),
        getVariations(product.idEcommerce, product.url),
      ]);
      let woocommerceProduct = responses[0];
      let variation = responses[1];

      product.name = woocommerceProduct.name;
      product.permalink = woocommerceProduct.permalink;
      product.date_created = woocommerceProduct.date_created;
      product.date_modified = woocommerceProduct.date_modified;
      product.type = woocommerceProduct.type;
      product.status = woocommerceProduct.status; //publish
      product.catalog_visibility = woocommerceProduct.catalog_visibility;
      product.sku = woocommerceProduct.sku;
      product.stock_status = woocommerceProduct.stock_status;
      product.regular_price = woocommerceProduct.regular_price;
      product.sale_price = woocommerceProduct.sale_price;
      product.related_ids = woocommerceProduct.related_ids;
      product.related_ids = woocommerceProduct.related_ids;
      product.images = woocommerceProduct.images;
      product.attributes = woocommerceProduct.attributes;
      product.variations = variation;
      // product.variations = variation;
      product.save();
      console.log('producto actualizado!!');
    } catch (error) {
      console.log('un error: ', error);
    }
  }
  console.log('fin!!');
})();

async function getProductWoocommerce(productId, sourceUrl) {
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
      url: BASE_URL + '/wp-json/wc/v3/products/' + productId,
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
    console.log('error 2: ', error);
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
