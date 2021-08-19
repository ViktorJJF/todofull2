require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const EcommercesContacts = require('./models/EcommercesContacts');

let COUNTRY = 'Peru';
let BASE_URL = 'https://mujeron.pe';
const USERNAME = 'ck_8daab84dca6302e69a953ed7bb5b52e0c7fad4d1';
const PASSWORD = 'cs_153bcca7bf6e973369d15ea74b71d4a74db07ca0';
let buff = new Buffer(USERNAME + ':' + PASSWORD);
let base64data = buff.toString('base64');

(async () => {
  let currentPage = 1;
  let isDone = false;
  try {
    while (!isDone) {
      let customers = [];
      let res = await axios({
        method: 'get',
        url:
          BASE_URL +
          `/wp-json/wc/v3/customers?page=${currentPage}&per_page=100`,
        withCredentials: true,
        headers: {
          Authorization: 'Basic ' + base64data,
        },
      });
      //emparejando datos
      for (const contact of res.data) {
        let customerToDB = {
          idContact: contact.id,
          first_name: contact.billing ? contact.billing.first_name : '',
          last_name: contact.billing ? contact.billing.last_name : '',
          phone: contact.billing ? contact.billing.phone : '',
          email: contact.billing ? contact.billing.email : '',
          date_modified: contact.date_modified,
          date_created: contact.date_created,
          city: contact.billing ? contact.billing.city : '',
          state: contact.billing ? contact.billing.state : '',
          mailchimp: {
            id: contact.meta_data
              ? contact.meta_data.find(
                  (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                )
                ? contact.meta_data.find(
                    (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                  ).id
                : ''
              : '',
            status: contact.meta_data
              ? contact.meta_data.find(
                  (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                )
                ? contact.meta_data.find(
                    (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                  ).value
                : ''
              : '',
          },
          country: COUNTRY,
          url: BASE_URL,
        };
        if (
          customerToDB.first_name.trim().length > 0 ||
          customerToDB.phone.trim().length > 0 ||
          customerToDB.city.trim().length > 0
        ) {
          customers.push(customerToDB);
        }
      }
      console.log('los customers: ', customers);
      console.log('tamaño: ', customers.length);
      await EcommercesContacts.insertMany(customers);
      console.log('hecho!');
      //el resto
      console.log(`Página ${currentPage} importada....`);
      currentPage += 1;
      if (res.data.length == 0) isDone = true;
    }
    console.log('fin!!');
  } catch (error) {
    console.log('error->', error);
  }
})();

function getUrl(text) {
  let regex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  let result = text.match(regex);
  return result[result.length - 1];
}
