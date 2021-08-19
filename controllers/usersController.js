const uuid = require('uuid');
const bcrypt = require('bcrypt');
const model = require('../models/Users.js');
const utils = require('../helpers/utils');
const db = require('../helpers/db');
const emailer = require('../helpers/emailer');

/** *******************
 * Private functions *
 ******************** */

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async (body) =>
  new Promise((resolve, reject) => {
    const user = new model(body);
    user.verification = uuid.v4();
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      // Removes properties with rest operator
      const removeProperties = ({
        // eslint-disable-next-line no-unused-vars
        password,
        // eslint-disable-next-line no-unused-vars
        blockExpires,
        // eslint-disable-next-line no-unused-vars
        loginAttempts,
        ...rest
      }) => rest;
      resolve(removeProperties(item.toObject()));
    });
  });

/** ******************
 * Public functions *
 ******************* */

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.list = async (req, res) => {
  try {
    // const query = await db.checkQueryString(req.query);
    let { query } = req;
    res.status(200).json(await db.getItems(req, model, query));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.listOne = async (req, res) => {
  try {
    // req = matchedData(req);
    const id = await utils.isIDGood(req.params.id);
    res.status(200).json(await db.getItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.update = async (req, res) => {
  try {
    // req = matchedData(req);
    const { body } = req;
    const id = await utils.isIDGood(req.params.id);
    const doesEmailExists = await emailer.emailExistsExcludingMyself(
      id,
      body.email,
    );
    if (!doesEmailExists) {
      res.status(200).json(await db.updateItem(id, model, body));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.updatePassword = async (req, res) => {
  let id = req.params.id;
  let body = req.body;
  let newPassword = await bcrypt.hash(
    body.newPassword,
    parseInt(process.env.SALTROUNDS),
  );
  model.findOneAndUpdate(
    { _id: id },
    { password: newPassword },
    {
      new: true,
      runValidators: true,
    },
    (err) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          message: 'Algo salió mal',
          err,
        });
      }
      res.json({
        ok: true,
        message: 'Contraseña actualizada con éxito',
      });
    },
  );
};

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.create = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const { body } = req;
    const locale = req.getLocale() || 'es';
    // req = matchedData(req);
    const doesEmailExists = await emailer.emailExists(body.email);
    if (!doesEmailExists) {
      const item = await createItem(body);
      emailer.sendRegistrationEmailMessage(locale, item);
      res.status(201).json(item);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deletes = async (req, res) => {
  try {
    // req = matchedData(req);
    const id = await utils.isIDGood(req.params.id);
    res.status(200).json(await db.deleteItem(id, model));
  } catch (error) {
    utils.handleError(res, error);
  }
};
