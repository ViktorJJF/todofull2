const model = require('../models/Ecommerces');
const utils = require('../helpers/utils');
const db = require('../helpers/db');

/** *******************
 * Private functions *
 ******************** */

const UNIQUEFIELDS = ['name'];

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
    if (req.query.listType) {
      var listType = JSON.parse(JSON.stringify(req.query.listType));
      delete req.query.listType;
    }

    const query = await db.checkQueryString(req.query);
    let filterCriteria = {
      type: { $ne: 'variation' },
    };
    if (listType != 'All')
      filterCriteria['stock_status'] = { $ne: 'outofstock' };
    res.status(200).json(await db.getItems(req, model, query, filterCriteria));
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
const update = async (req, res) => {
  try {
    // req.body.userId = req.user._id;
    const id = await utils.isIDGood(req.params.id);
    // const doesItemExists = await itemExistsExcludingItself(id, req.body);
    // if (!doesItemExists) {
    res.status(200).json(await db.updateItem(id, model, req.body));
    // }
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
};
