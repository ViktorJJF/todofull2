const axios = require('axios');
const model = require('../models/CleanLeads');
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

const listOneAdvanced = async (req, res) => {
  try {
    const path = req.params.path;
    const value = req.params.value;
    res.status(200).json(await db.getItemAdvanced(path, value, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    // req.body.userId = req.user._id;
    // const doesItemExists = await itemExists(req.body);
    // if (!doesItemExists) {
    console.log('vino este body: ', req.body);
    // res.status(200).json(await db.createItem(req.body, model));
    // }
    //verificando si el lead ya existia
    let lead = await utils.searchCleanLead(req.body.telefono);
    if (lead) {
      //verificando si ya tenia esa fuente
      let leadDetails = lead.details.find(
        (detail) => detail.fuente == req.body.details[0].fuente,
      );
      if (leadDetails) {
        leadDetails.msnActivaDefault = req.body.details[0].msnActivaDefault;
        leadDetails.nota = req.body.details[0].nota;
        leadDetails.type = req.body.details[0].type;
      } else {
        lead.details.push(req.body.details[0]);
      }
      lead.estado = req.body.estado;
      await lead.save();
      res.status(200).json(await { ok: true, payload: lead });
    } else {
      res.status(200).json(await db.createItem(req.body, model));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

const createFacebookLabel = async (req, res) => {
  try {
    const userId = req.body.userId; // se puede recibir el id exacto del lead
    const type = req.body.type; // se puede recibir la type
    const path = req.params.path;
    let detailIndex;
    let search = {
      [path]: req.body.senderId,
    };
    if (userId) {
      search['_id'] = userId;
    }
    if (type) {
      search['details.type'] = type;
    }
    const cleanLead = await model.findOne(search);
    // seleccionado detail a actualizar
    if (type) {
      detailIndex = cleanLead.details.findIndex(
        (el) => el.fuente === req.body.senderId && el.type === type,
      );
    } else {
      detailIndex = cleanLead.details.findIndex(
        (el) => el.contactId === req.body.senderId,
      );
    }
    cleanLead.details[detailIndex].labels.push(req.body);
    await cleanLead.save();
    // await model.update(
    //   { 'details.contactId': req.body.senderId },
    //   { $push: { 'details.1.labels': req.body } },
    //   { upsert: true },
    // );
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
      console.log('no se entro aca');
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
                givenName: req.body.details[0].nombre,
              },
            ],
            phoneNumbers: [{ value: req.body.telefono }],
            emailAddresses: [{ value: req.body.details[0].email }],
          },
        },
      );
    }
    const doesItemExists = await itemExistsExcludingItself(id, req.body);
    console.log('🚀 Aqui *** -> doesItemExists', doesItemExists);
    if (!doesItemExists) {
      res.status(200).json(await db.updateItem(id, model, req.body));
    }
  } catch (error) {
    console.log('🚀 Aqui *** -> error', error);
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

const autoAssignAgent = async (req, res) => {
  try {
    // // const { country, leadId } = req.body;
    // // // listando agentes activos
    // // const telefonos = await Telefono.find({ active: true });
    // // // buscando lead
    // // const lead=
    // res.status(200).json(await db.deleteItem(id, model));
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
  createFacebookLabel,
  listOneAdvanced,
  autoAssignAgent,
};
