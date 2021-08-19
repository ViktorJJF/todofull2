const axios = require('axios');
const model = require('../models/Contactos');
const utils = require('../helpers/utils');
const { startsWith, deletePhoneCountryCode } = require('../helpers/utils2');
const db = require('../helpers/db');
const Telefono = require('../models/Telefonos');
const ContactsPercentage = require('../models/ContactsPercentages');

/** *******************
 * Private functions *
 ******************** */

const UNIQUEFIELDS = [];

const itemExistsExcludingItself = async (id, body) =>
  new Promise((resolve, reject) => {
    const query = UNIQUEFIELDS.length > 0 ? {} : { noFields: true };
    for (const uniquefield of UNIQUEFIELDS) {
      query[uniquefield] = body[uniquefield];
    }
    query._id = {
      $ne: id,
    };
    model.findOne(query, (err, item) => {
      utils.itemAlreadyExists(err, item, reject, 'Este registro ya existe');
      resolve(false);
    });
  });

const itemExists = async (body) =>
  new Promise((resolve, reject) => {
    const query = UNIQUEFIELDS.length > 0 ? {} : { noFields: true };
    for (const uniquefield of UNIQUEFIELDS) {
      query[uniquefield] = body[uniquefield];
    }
    model.findOne(query, (err, item) => {
      console.log('el item es: ', item);
      utils.itemAlreadyExists(err, item, reject, 'Este registro ya existe');
      resolve(false);
    });
  });

/**
 * Gets all items from database
 */

const listAll = async (req, res) => {
  try {
    res.status(200).json(await db.getAllItems(model));
  } catch (error) {
    utils.handleError(res, error);
  }
};

const list = async (req, res) => {
  try {
    // const { query } = req;
    const query = await db.checkQueryString(req.query);
    res.status(200).json(await db.getItems(req, model, query));
  } catch (error) {
    utils.handleError(res, error);
  }
};

const listOne = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.params.id);
    res.status(200).json(await db.getItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    // req.body.userId = req.user._id;
    let credentials = (await db.getItem(req.body.telefonoId, Telefono)).payload
      .credenciales;
    const doesItemExists = await itemExists(req.body);
    if (!doesItemExists) {
      let googleContactRes = await axios.post(
        process.env.API_URL + '/api/google-people/contacts/create',
        {
          ...credentials,
          requestBody: {
            names: [
              {
                familyName: req.body.apellido,
                middleName: req.body.segundoNombre,
                givenName: req.body.nombre,
              },
            ],
            phoneNumbers: [
              {
                value: deletePhoneCountryCode(req.body.celular),
              },
            ],
            emailAddresses: [{ value: req.body.email }],
          },
        },
      );
      //agregando datos creados por google contact
      req.body = {
        ...req.body,
        resourceName: googleContactRes.data.payload.resourceName,
        etag: googleContactRes.data.payload.etag,
      };
      res.status(200).json(await db.createItem(req.body, model));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
const update = async (req, res) => {
  try {
    // req.body.userId = req.user._id;
    let credentials = (await db.getItem(req.body.telefonoId, Telefono)).payload
      .credenciales;
    const id = await utils.isIDGood(req.params.id);
    const doesItemExists = await itemExistsExcludingItself(id, req.body);
    if (!doesItemExists) {
      let googleContactRes = await axios.put(
        process.env.API_URL + '/api/google-people/contacts/update',
        {
          ...credentials,
          resourceName: req.body.resourceName,
          requestBody: {
            etag: req.body.etag,
            names: [
              {
                familyName: req.body.apellido,
                middleName: req.body.segundoNombre,
                givenName: req.body.nombre,
              },
            ],
            phoneNumbers: [
              {
                value:
                  startsWith(req.body.celular, '51') ||
                  startsWith(req.body.celular, '56') ||
                  startsWith(req.body.celular, '57')
                    ? req.body.celular.replace('51')
                    : req.body.celular,
              },
            ],
            emailAddresses: [{ value: req.body.email }],
          },
        },
      );
      //agregando datos creados por google contact
      req.body = {
        ...req.body,
        etag: googleContactRes.data.payload.etag,
      };
      res.status(200).json(await db.updateItem(id, model, req.body));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
const deletes = async (req, res) => {
  try {
    let credentials = (await db.getItem(req.body.telefonoId, Telefono)).payload
      .credenciales;
    await axios.delete(
      process.env.API_URL + '/api/google-people/contacts/delete',
      {
        data: {
          ...credentials,
          resourceName: req.body.resourceName,
        },
      },
    );
    const id = await utils.isIDGood(req.params.id);
    res.status(200).json(await db.deleteItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};
async function deletesAllByTelefonoId(req, res) {
  console.log('vino esto: ', req.params);
  await model.deleteMany({ telefonoId: req.params.telefonoId });
  await ContactsPercentage.deleteOne({ telefonoId: req.params.telefonoId });
  res.status(200).json({
    ok: true,
    msg: 'Eliminados los contactos del agente',
    payload: {},
  });
}

module.exports = {
  list,
  listAll,
  listOne,
  create,
  update,
  deletes,
  deletesAllByTelefonoId,
};
