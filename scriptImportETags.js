require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const EcommercesCategory = require('./models/EcommercesTags');

let BASE_URL = 'https://mujeron.cl';
const USERNAME = 'ck_78ff728bc20022062d377cc406914cfdd86da9fe';
const PASSWORD = 'cs_1173bfaafc6fb20753eb063d559af2d14f654296';
let buff = new Buffer(USERNAME + ':' + PASSWORD);
let base64data = buff.toString('base64');

(async () => {
  let tags = [];
  try {
    let res = await axios({
      method: 'get',
      url: BASE_URL + '/wp-json/wc/v3/products/tags?page=3&per_page=100',
      withCredentials: true,
      headers: {
        Authorization: 'Basic ' + base64data,
      },
    });
    for (const tag of res.data) {
      let tagToDB = {
        idTag: tag.id,
        name: tag.name,
        slug: tag.slug,
        url: getUrl(tag.yoast_head),
        country: 'Chile',
        webpage: BASE_URL,
        count: tag.count,
      };
      tags.push(tagToDB);
      console.log('etiqueta:', tag.name, tagToDB.url);
    }
    console.log(tags.length);
    await EcommercesCategory.insertMany(tags);
    console.log('hecho!');
  } catch (error) {
    console.log('error->', error);
  }
})();

function getUrl(text) {
  let regex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  let result = text.match(regex);
  return result[result.length - 1];
}
