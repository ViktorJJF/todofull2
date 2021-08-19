require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const EcommercesContact = require('./models/EcommercesContacts');
(async () => {
  console.log('aaa');
  // let ecommercesContacts = await EcommercesContact.deleteMany({
  //   date_modified: {
  //     $lt: new Date('2018-06-20T00:53:36.539Z'),
  //   },
  // });
  console.log('hecho!!');
})();
