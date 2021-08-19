require('dotenv-safe').config();
const initMongo = require('./config/mongo');

initMongo();
const axios = require('axios');
const EcommercesAttributes = require('./models/EcommercesAttributes');

let BASE_URL = 'https://mujeron.pe';
const USERNAME = 'ck_8daab84dca6302e69a953ed7bb5b52e0c7fad4d1';
const PASSWORD = 'cs_153bcca7bf6e973369d15ea74b71d4a74db07ca0';
let buff = new Buffer(`${USERNAME}:${PASSWORD}`);
let base64data = buff.toString('base64');

(async () => {
  let attributesDB = await EcommercesAttributes.find().lean();
  let attributes = [];
  try {
    let res = await axios({
      method: 'get',
      url: `${BASE_URL}/wp-json/wc/v3/products/attributes?page=1&per_page=100`,
      withCredentials: true,
      headers: {
        Authorization: `Basic ${base64data}`,
      },
    });
    for (const atributo of res.data) {
      let attributeToDB = {
        idAttribute: atributo.id,
        name: atributo.name,
        terms: [],
        woocommerceId: '6014b781bffbfd0017c1c2ef',
      };
      if (
        attributesDB.findIndex(
          (el) => el.idAttribute == attributeToDB.idAttribute,
        ) == -1
      ) {
        attributes.push(attributeToDB);
      }
      console.log('Atributo:', attributeToDB);
    }
    console.log(attributes.length);
    await EcommercesAttributes.insertMany(attributes);
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
