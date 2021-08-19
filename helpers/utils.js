const axios = require('axios');
const mongoose = require('mongoose');
const requestIp = require('request-ip');
const { validationResult } = require('express-validator');
const { checkQueryString, getItems, getItems2, getItemsLean } = require('./db');
const CleanLead = require('../models/CleanLeads');
const Bots = require('../models/Bots');
const FacebookLabels = require('../models/FacebookLabels');

exports.convertToDate = (date) => {
  const preFormated = new Date(date);
  let formatedDate = new Date(
    preFormated.getTime() - preFormated.getTimezoneOffset() * -60000,
  );
  return formatedDate;
};

exports.selectRandomId = (collection) =>
  collection[this.Random(0, collection.length - 1)]._id;

exports.Random = (min, max) => {
  let newMin = Math.ceil(min);
  let newMax = Math.floor(max);
  return Math.floor(Math.random() * (newMax - newMin + 1)) + min;
};
/**
 * Removes extension from file
 * @param {string} file - filename
 */
exports.removeExtensionFromFile = (file) =>
  file.split('.').slice(0, -1).join('.').toString();

/**
 * Gets IP from user
 * @param {*} req - request object
 */
exports.getIP = (req) => requestIp.getClientIp(req);

/**
 * Gets browser info from user
 * @param {*} req - request object
 */
exports.getBrowserInfo = (req) => req.headers['user-agent'];

/**
 * Gets country from user using CloudFlare header 'cf-ipcountry'
 * @param {*} req - request object
 */
exports.getCountry = (req) =>
  req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX';

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
exports.handleError = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV !== 'production') {
    console.log(err.message);
  }
  // Sends error to user
  res.status(err.code).json({
    errors: {
      msg: err.message,
    },
  });
};

/**
 * Builds error object
 * @param {number} code - error code
 * @param {string} message - error text
 */
exports.buildErrObject = (code, message) => ({
  code,
  message,
});

/**
 * Builds error for validation files
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Object} next - next object
 */
exports.validationResult = (req, res, next) => {
  try {
    validationResult(req).throw();
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
    return next();
  } catch (err) {
    return this.handleError(res, this.buildErrObject(422, err.array()));
  }
};

/**
 * Builds success object
 * @param {string} message - success text
 */
exports.buildSuccObject = (message) => ({
  msg: message,
});

/**
 * Checks if given ID is good for MongoDB
 * @param {string} id - id to check
 */
exports.isIDGood = async (id) =>
  new Promise((resolve, reject) => {
    const goodID = mongoose.Types.ObjectId.isValid(id);
    return goodID
      ? resolve(id)
      : reject(this.buildErrObject(422, 'ID_MALFORMED'));
  });

/**
 * Item not found
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemNotFound = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message));
  }
  if (!item) {
    reject(this.buildErrObject(404, message));
  }
};

/**
 * Item already exists
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemAlreadyExists = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message));
  }
  if (item) {
    reject(this.buildErrObject(422, message));
  }
};

exports.random = (min, max) => {
  let newMin = Math.ceil(min);
  let newMax = Math.floor(max);
  return Math.floor(Math.random() * (newMax - newMin + 1)) + min;
};
exports.searchCleanLead = async (telefono) => {
  let query = await checkQueryString({
    filter: telefono,
    fields: 'telefono',
  });
  let cleanLeads = await getItems2(CleanLead, query);
  if (cleanLeads.length > 0) {
    return cleanLeads[0];
  }
  return null;
};

exports.getCountryFromDomain = (domain) =>
  domain.includes('.cl')
    ? 'Chile'
    : domain.includes('.pe')
    ? 'Peru'
    : 'Colombia';

exports.fuzzyPhoneSearch = async (phone, fieldName, model) => {
  let query = await checkQueryString({
    filter: phone,
    fields: fieldName,
  });
  let items = await getItems2(model, query);
  if (items.length > 0) {
    return items[0];
  }
  return null;
};

exports.formatPhone = (phone, country) => {
  // country Peru, Chile, Colombia, etc
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  let countryCode = this.getCountryCode(country);
  if (this.startsWith(cleanPhone, countryCode)) return cleanPhone;
  return countryCode + cleanPhone;
};

exports.startsWith = (str, word) => str.lastIndexOf(word, 0) === 0;

exports.getCountryCode = (country) => {
  let countries = {
    Peru: '51',
    Chile: '56',
    Colombia: '58',
  };
  return countries[country] || '';
};

exports.searchLabel = async (search, country) => {
  // obteniendo bots
  let bots = await Bots.find({ country }).lean();
  let query = await checkQueryString({
    filter: search.toLowerCase().includes('talla') ? search : `talla ${search}`,
    fields: 'name',
  });
  // filtrando etiquetas por pais
  let items = await getItemsLean(FacebookLabels, query);
  items = items
    .map((item) => ({
      ...item,
      country: bots.find((bot) => bot.fanpageId == item.fanpageId)
        ? bots.find((bot) => bot.fanpageId == item.fanpageId).country
        : null,
    }))
    .filter((item) => item.country === country);
  return items.length > 0 ? items[0] : null;
};

exports.setTodofullLabel = async (senderId, etiqueta) => {
  try {
    let baseUrl =
      process.env.NODE_ENV == 'development'
        ? 'http://localhost:5000'
        : 'https://todo--full.herokuapp.com';
    let responses = await Promise.all([
      axios.get(`${baseUrl}/api/facebook-labels?idLabel=${etiqueta}`),
      axios.get(
        `${baseUrl}/api/clean-leads/list-one-advanced/details.contactId/${senderId}`,
      ),
    ]);
    let etiquetaTodofull = responses[0].data.payload[0];
    // console.log("la etiqueta todofull: ",etiquetaTodofull);
    let cleanLead = responses[1].data.payload;
    if (cleanLead) {
      await axios
        .post(`${baseUrl}/api/clean-leads/${cleanLead._id}/labels`, {
          labelId: etiquetaTodofull._id,
          senderId,
        })
        .then((res) =>
          console.log('etiqueta agregada con exito a cleanLeads!:', res.data),
        );
    }
  } catch (err) {
    console.log(err);
    console.log('el error: ', err.response);
  }
};
