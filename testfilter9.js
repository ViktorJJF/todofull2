require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const EcommercesOrders = require('./models/EcommercesOrders');
const EcommercesContacts = require('./models/EcommercesContacts');
const utils = require('./helpers/utils');
const db = require('./helpers/db');

(async () => {
  let test = {
    sort: 'date_modified',
    order: '-1',
    page: '1',
    limit: '30',
    filter: 'david',
    fields: 'ecommercesContactId.first_name',
  };
  // const query = await db.checkQueryString(test);
  // console.log(await db.getItems({}, model, query));
  // let orders = await EcommercesOrders.find({}).limit(10);
  // console.log('resultado: ', orders);
  let req = {
    sort: 'date_modified',
    order: '-1',
    page: '1',
    limit: '30',
    filter: 'navarrete',
    fields: 'first_name,last_name,phone,email',
  };
  filterByRelation(EcommercesOrders, EcommercesContacts, req);
})();

async function filterByRelation(modelToFilter, modelRelation, req) {
  const query = await db.checkQueryString(req.query);
  console.log(await db.getItems(req, modelRelation, query));
}

// async function checkQueryString(query) {
//   return new Promise((resolve, reject) => {
//     //se obtiene campos fuera del filtro y campos
//     let queries = {};
//     for (const key in query) {
//       if (query.hasOwnProperty.call(query, key)) {
//         const element = query[key];
//         if (
//           key !== 'filter' &&
//           key !== 'fields' &&
//           key !== 'page' &&
//           key !== 'filter'
//         ) {
//           queries[key] = element;
//         }
//       }
//     }
//     try {
//       if (
//         typeof query.filter !== 'undefined' &&
//         typeof query.fields !== 'undefined'
//       ) {
//         const data = {
//           $or: [],
//         };
//         const array = [];
//         // Takes fields param and builds an array by splitting with ','
//         const arrayFields = query.fields.split(',');
//         // Adds SQL Like %word% with regex
//         arrayFields.map((item) => {
//           array.push({
//             [item]: {
//               $regex: new RegExp(query.filter, 'i'),
//             },
//           });
//           return true;
//         });
//         // Puts array result in data
//         data.$or = array;
//         resolve({ ...data, ...queries });
//       } else {
//         resolve(queries);
//       }
//     } catch (err) {
//       console.log(err.message);
//       reject(buildErrObject(422, 'ERROR_WITH_FILTER'));
//     }
//   });
// }
