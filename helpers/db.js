const { buildErrObject, itemNotFound } = require('./utils');
const { isNumeric } = require('./utils2');

/**
 * Builds sorting
 * @param {string} sort - field to sort from
 * @param {number} order - order for query (1,-1)
 */
const buildSort = (sort, order) => {
  const sortBy = {};
  sortBy[sort] = order;
  return sortBy;
};

/**
 * Hack for mongoose-paginate, removes 'id' from results
 * @param {Object} result - result object
 */
const cleanPaginationID = (result) => {
  result.docs.map((element) => delete element.id);
  result = renameKey(result, 'docs', 'payload');
  return result;
};

function renameKey(object, key, newKey) {
  const clonedObj = { ...object };
  const targetKey = clonedObj[key];
  delete clonedObj[key];
  clonedObj[newKey] = targetKey;
  return clonedObj;
}

/**
 * Builds initial options for query
 * @param {Object} query - query object
 */
const listInitOptions = async (req) =>
  new Promise((resolve) => {
    const order = req.query.order || 'desc';
    const sort = req.query.sort || 'updatedAt';
    const sortBy = buildSort(sort, order);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 99999;
    const options = {
      order,
      sort: sortBy,
      lean: true,
      page,
      limit,
    };
    resolve(options);
  });

module.exports = {
  /**
   * Checks the query string for filtering records
   * query.filter should be the text to search (string)
   * query.fields should be the fields to search into (array)
   * @param {Object} query - query object
   */
  listInitOptions,
  renameKey,
  async checkQueryString(query) {
    return new Promise((resolve, reject) => {
      // se obtiene campos fuera del filtro y campos
      let queries = {};
      for (const key in query) {
        if (query.hasOwnProperty.call(query, key)) {
          const element = query[key];
          if (
            key !== 'filter' &&
            key !== 'fields' &&
            key !== 'page' &&
            key !== 'filter'
          ) {
            queries[key] = element;
          }
        }
      }
      try {
        if (
          typeof query.filter !== 'undefined' &&
          typeof query.fields !== 'undefined'
        ) {
          const data = {
            $or: [],
          };
          const array = [];
          // Takes fields param and builds an array by splitting with ','
          const arrayFields = query.fields.split(',');
          // Adds SQL Like %word% with regex
          arrayFields.map((item) => {
            array.push({
              [item]: {
                $regex: new RegExp(query.filter, 'i'),
              },
            });
            return true;
          });
          // Puts array result in data
          data.$or = array;
          resolve({ ...data, ...queries });
        } else {
          resolve(queries);
        }
      } catch (err) {
        console.log(err.message);
        reject(buildErrObject(422, 'ERROR_WITH_FILTER'));
      }
    });
  },
  async checkQueryStringRelational(req, foreignModel, foreignKey) {
    return new Promise(async (resolve, reject) => {
      // se obtiene campos fuera del filtro y campos
      let originalQuery = JSON.parse(JSON.stringify(req.query));
      let { query } = req;
      let queries = {};
      for (const key in query) {
        if (query.hasOwnProperty.call(query, key)) {
          const element = query[key];
          if (
            key !== 'filter' &&
            key !== 'fields' &&
            key !== 'page' &&
            key !== 'filter'
          ) {
            if (!key.includes('foreign_')) queries[key] = element;
          }
        }
      }
      try {
        if (
          typeof query.filter !== 'undefined' &&
          typeof query.fields !== 'undefined'
        ) {
          // se obtiene la consulta de la relacion
          originalQuery.fields = originalQuery.fields
            .split(',')
            .filter((el) => el.includes('foreign_'))
            .map((el) => el.replace('foreign_', ''))
            .join(',');
          const queryItems = await this.checkQueryString(originalQuery);
          let filteredItems = (
            await this.getItems(req, foreignModel, queryItems)
          ).payload;
          const data = {
            $or: [],
          };
          const array = [];
          // Takes fields param and builds an array by splitting with ','
          const arrayFields = query.fields
            .split(',')
            .filter(
              (el) => !el.includes('foreign_') && !el.includes('number_'),
            );
          const arrayNumberFields = query.fields
            .split(',')
            .filter((el) => el.includes('number_'))
            .map((el) => el.replace('number_', ''));
          // Adds SQL Like %word% with regex
          if (isNumeric(query.filter)) {
            arrayNumberFields.map((item) => {
              array.push({
                [item]: parseInt(query.filter),
              });
            });
          }
          // else {
          // si no se trata de un campo numerico, probar buscando el resto de fields
          arrayFields.map((item) => {
            array.push({
              [item]: {
                $regex: new RegExp(query.filter, 'i'),
              },
            });
            return true;
          });
          filteredItems.map((item) => {
            array.push({
              [foreignKey]: item._id,
            });
            return true;
          });
          // }

          // Puts array result in data
          data.$or = array;
          resolve({ ...data, ...queries });
        } else {
          resolve(queries);
        }
      } catch (err) {
        console.log('error->', err.message);
        // reject(this.buildErrObject(422, 'ERROR_WITH_FILTER'));
      }
    });
  },

  /**
   * Gets ALL items from database
   * @param {Object} req - request object
   * @param {Object} query - query object
   */
  async getAllItems(model) {
    return new Promise((resolve, reject) => {
      model.find(
        {},
        '-updatedAt -createdAt',
        {
          sort: {
            name: 1,
          },
        },
        (err, payload) => {
          if (err) {
            reject(buildErrObject(422, err.message));
          }
          resolve({ ok: true, payload });
        },
      );
    });
  },

  /**
   * Gets items from database
   * @param {Object} req - request object
   * @param {Object} query - query object
   */
  async getItems(req, model, query, customQuery) {
    const options = await listInitOptions(req);
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        if (query.hasOwnProperty(key)) delete query[key];
      }
    }
    return new Promise(async (resolve, reject) => {
      model.paginate(
        { $and: [{ ...query }, { ...customQuery }] },
        options,
        (err, items) => {
          if (err) {
            reject(buildErrObject(422, err.message));
          }
          resolve({ ok: true, ...cleanPaginationID(items) });
        },
      );
    });
  },
  async getItems2(model, query) {
    return new Promise((resolve, reject) => {
      model.find(query, {}, (err, items) => {
        if (err) {
          console.log(err);
        }
        resolve(items);
      });
    });
  },
  async getItemsLean(model, query) {
    return new Promise((resolve, reject) => {
      model
        .find(query, {}, (err, items) => {
          if (err) {
            console.log(err);
          }
          resolve(items);
        })
        .lean();
    });
  },
  /**
   * Gets aggregated items from database
   * @param {Object} req - request object
   * @param {Object} query - query object
   */
  async getAggregatedItems(req, model, aggregated) {
    const options = await listInitOptions(req);
    return new Promise((resolve, reject) => {
      model.aggregatePaginate(aggregated, options, (err, items) => {
        if (err) {
          reject(buildErrObject(422, err.message));
        } else {
          resolve({ ok: true, ...cleanPaginationID(items) });
        }
      });
    });
  },

  /**
   * Gets item from database by id
   * @param {string} id - item id
   */
  async getItem(id, model) {
    console.log('el id: ', id);
    return new Promise((resolve, reject) => {
      model.findById(id, (err, payload) => {
        // if(err) itemNotFound(err, payload, reject, 'NOT_FOUND');
        resolve({ ok: true, payload });
      });
    });
  },
  async getItemAdvanced(path, value, model) {
    return new Promise((resolve, reject) => {
      let filter = {};
      filter[path] = value;
      model.findOne(filter, (err, payload) => {
        resolve({ ok: true, payload });
      });
    });
  },
  /**
   * Gets item from database by custom fields
   * @param {object} fields - fields
   */
  async filterItems(fields, model) {
    return new Promise((resolve, reject) => {
      model.find(fields, (err, payload) => {
        if (err) {
          reject(buildErrObject(422, err.message));
        }
        resolve({ ok: true, payload });
      });
    });
  },

  /**
   * Creates a new item in database
   * @param {Object} req - request object
   */
  async createItem(body, model) {
    return new Promise((resolve, reject) => {
      const item = new model(body);
      item.save((err, payload) => {
        if (err) {
          console.log('salio este error:', err);
          reject(buildErrObject(422, err.message));
        }
        resolve({ ok: true, payload });
      });
    });
  },

  /**
   * Updates an item in database by id
   * @param {string} id - item id
   * @param {Object} req - request object
   */
  async updateItem(id, model, body) {
    return new Promise((resolve, reject) => {
      model.findById(id, (err1, item) => {
        if (err1) {
          console.log(err1);
          reject(buildErrObject(422, err1.message));
        }
        if (!item) {
          return itemNotFound(err1, item, reject, 'NOT_FOUND');
        }
        item.set(body);
        item.save((err2, payload) => {
          console.log(err2);
          if (err2) {
            reject(buildErrObject(422, err2.message));
          }
          resolve({ ok: true, payload });
        });
      });
    });
  },

  /**
   * Deletes an item from database by id
   * @param {string} id - id of item
   */
  async deleteItem(id, model) {
    return new Promise((resolve, reject) => {
      model.findById(id, (err1, item) => {
        if (err1) {
          reject(buildErrObject(422, err1.message));
        }
        if (!item) {
          return itemNotFound(err1, item, reject, 'NOT_FOUND');
        }
        item.remove((err2, payload) => {
          if (err2) {
            reject(buildErrObject(422, err2.message));
          }
          resolve({ ok: true, payload });
        });
      });
    });
  },
};
