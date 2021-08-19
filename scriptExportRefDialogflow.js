require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const Ecommerce = require('./models/Ecommerces');
const axios = require('axios');

(async () => {
  let ecommerces = await Ecommerce.find({ country: 'Peru' });
  console.log('ecommerces: ', ecommerces);
  let index = 0;
  for (const ecommerce of ecommerces) {
    try {
      let res = await axios.put(
        'http://localhost:5000/api/dialogflow-api/update-entity-value',
        {
          country: ecommerce.country,
          value: ecommerce.ref,
          newValue: ecommerce.ref,
        },
      );
      index += 1;
      console.log('hecho:', index);
    } catch (error) {
      console.log(error);
    }
  }
})();
