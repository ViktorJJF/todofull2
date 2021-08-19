require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const EcommercesAttributes = require('./models/EcommercesAttributes');

let BASE_URL = 'https://mujeron.pe';
const USERNAME = 'ck_8daab84dca6302e69a953ed7bb5b52e0c7fad4d1';
const PASSWORD = 'cs_153bcca7bf6e973369d15ea74b71d4a74db07ca0';
let buff = new Buffer(USERNAME + ':' + PASSWORD);
let base64data = buff.toString('base64');

(async () => {
  let terms = [];
  try {
    let res = await axios({
      method: 'get',
      url:
        BASE_URL + '/wp-json/wc/v3/products/attributes/12/terms?per_page=100',
      withCredentials: true,
      headers: {
        Authorization: 'Basic ' + base64data,
      },
    });
    let terms = res.data.map((el) => ({
      idTerm: el.id,
      name: el.name,
      slug: el.slug,
      description: el.description,
    }));
    let ecommercesAttribute = await EcommercesAttributes.findOne({
      _id: '609dcbc29359d5227c50c4cb',
    });
    ecommercesAttribute.terms = terms;
    await ecommercesAttribute.save();
    console.log('los terms: ', terms);
    console.log(res.data.length);
    // await Ecommercesterms.insertMany(terms);
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
