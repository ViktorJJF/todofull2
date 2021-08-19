const axios = require('axios');
const model = require('../models/Leads');
const utils = require('../helpers/utils');
const db = require('../helpers/db');
const Telefono = require('../models/Telefonos');

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

const list = async (req, res) => {
  try {
    // const { query } = req;
    if (req.query.telefonoId === '') req.query.telefonoId = null;
    const query = await db.checkQueryString(req.query);
    res
      .status(200)
      .json(await db.getItems(req, model, query, { telefono: { $ne: null } }));
  } catch (error) {
    utils.handleError(res, error);
  }
};

const listAll = async (req, res) => {
  try {
    // const { query } = req;
    if (req.query.telefonoId === '') req.query.telefonoId = null;
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
    const doesItemExists = await itemExists(req.body);
    if (!doesItemExists) {
      res.status(200).json(await db.createItem(req.body, model));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

const createLabel = async (req, res) => {
  try {
    // req.body.userId = req.user._id;
    await model.update(
      { _id: req.params.id },
      { $push: { labels: req.body } },
      { upsert: true },
    );
    res.status(200).json({ ok: true, msg: 'Label asociado con éxito' });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const update = async (req, res) => {
  try {
    // req.body.userId = req.user._id;
    const id = await utils.isIDGood(req.params.id);
    if (req.body.telefonoId && req.body.assign) {
      //creando contacto en Google Contact
      //trayendo credenciales
      let credentials = (await db.getItem(req.body.telefonoId, Telefono))
        .payload.credenciales;
      //
      await axios.post(
        process.env.API_URL + '/api/google-people/contacts/create',
        {
          ...credentials,
          requestBody: {
            names: [
              {
                familyName: '',
                middleName: '',
                givenName: req.body.nombre,
              },
            ],
            phoneNumbers: [{ value: req.body.telefono }],
            emailAddresses: [{ value: req.body.email }],
          },
        },
      );
    }
    const doesItemExists = await itemExistsExcludingItself(id, req.body);
    if (!doesItemExists) {
      res.status(200).json(await db.updateItem(id, model, req.body));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
const deletes = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.params.id);
    res.status(200).json(await db.deleteItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};

module.exports = {
  list,
  listAll,
  listOne,
  create,
  update,
  deletes,
  createLabel,
};
