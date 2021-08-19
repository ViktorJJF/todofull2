const axios = require('axios');
const config = require('../config');
const FacebookLabels = require('../models/FacebookLabels');
const Bots = require('../models/Bots');
const Woocommerces = require('../models/Woocommerces');
const { checkQueryString, getItemsLean } = require('./db');

function formatPhone(phone, country) {
  // country Peru, Chile, Colombia, etc
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  let countryCode = getCountryCode(country);
  if (startsWith(cleanPhone, countryCode)) return cleanPhone;
  return countryCode + cleanPhone;
}

function startsWith(str, word) {
  return str.lastIndexOf(word, 0) === 0;
}

function deletePhoneCountryCode(phone) {
  let formattedPhone = '';
  if (startsWith(phone, '51')) phone.replace('51', '');
  if (startsWith(phone, '56')) phone.replace('56', '');
  if (startsWith(phone, '47')) phone.replace('47', '');
  if (startsWith(phone, '+51')) phone.replace('+51', '');
  if (startsWith(phone, '+56')) phone.replace('+56', '');
  if (startsWith(phone, '+47')) phone.replace('+47', '');

  return formattedPhone;
}

function getCountryCode(country) {
  let countries = {
    Peru: '51',
    Chile: '56',
    Colombia: '58',
  };
  return countries[country] || '';
}

function isNumeric(str) {
  if (typeof str !== 'string') return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

async function sendWhatsappMessage(phone, message) {
  try {
    return await axios.post(`${config.BASE_URL_CHATBOT}/whatsapp/message`, {
      phone,
      message,
    });
  } catch (error) {
    console.log(error);
  }
}

async function getCleanLead(id) {
  try {
    return (
      await axios.get(`${config.BASE_URL_DASHBOARD}/api/clean-leads?_id=${id}`)
    ).data.payload[0];
  } catch (error) {
    console.log(error);
  }
}

async function updateCleanLead(id, payload) {
  try {
    await axios.put(
      config.BASE_URL_DASHBOARD + '/api/clean-leads/' + id,
      payload,
    );
  } catch (error) {
    console.log(error);
  }
}

async function getSourceList() {
  try {
    let responses = await Promise.all([
      Bots.find().lean(),
      Woocommerces.find().lean(),
    ]);
    let bots = responses[0];
    let woocommerces = responses[1];
    return [
      ...bots.map((bot) => ({
        _id: bot._id,
        name: bot.name,
        country: bot.country,
      })),
      ...woocommerces.map((woocommerce) => ({
        _id: woocommerce._id,
        name: woocommerce.domain,
        country: woocommerce.country,
      })),
    ];
  } catch (error) {
    console.log(error);
  }
}

/**
 *
 * @param {} sourceId Las fuentes son modelo Bots y Woocommerces
 */
async function getSourceById(sourceId) {
  let sources = await getSourceList();
  return sources.find((el) => el._id == sourceId);
}

function increaseCount(field, country) {
  // se aumenta el conteo de contacto para reconectar
  axios.post(config.BASE_URL_DASHBOARD + '/api/counts/increase', {
    field,
    country,
  });
}

async function colocarEtiquetaFB(
  senderId,
  etiqueta,
  path = 'details.contactId',
  userId,
  type,
) {
  try {
    console.log('agregando etiqueta: ', etiqueta);
    // consultando info del label
    let responses = await Promise.all([
      axios.get(
        `${config.BASE_URL_DASHBOARD}/api/facebook-labels?idLabel=${etiqueta}`,
      ),
      axios.get(
        `${config.BASE_URL_DASHBOARD}/api/clean-leads/list-one-advanced/${path}/${senderId}`,
      ),
    ]);
    let etiquetaTodofull = responses[0].data.payload[0];
    console.log('🚀 Aqui *** -> etiquetaTodofull', etiquetaTodofull);
    let cleanLead = responses[1].data.payload;
    console.log('🚀 Aqui *** -> cleanLead', cleanLead);
    if (etiquetaTodofull && cleanLead) {
      await axios
        .post(`${config.BASE_URL_DASHBOARD}/api/clean-leads/${path}/labels`, {
          labelId: etiquetaTodofull._id,
          senderId,
          userId,
          type,
        })
        .then((res) =>
          console.log('etiqueta agregada con exito a cleanLeads!:', res.data),
        );
    }
  } catch (err) {
    console.log('el error: ', err.response);
  }
}

module.exports = {
  formatPhone,
  startsWith,
  getCountryCode,
  isNumeric,
  deletePhoneCountryCode,
  sendWhatsappMessage,
  getCleanLead,
  updateCleanLead,
  getSourceById,
  increaseCount,
  colocarEtiquetaFB,
};
