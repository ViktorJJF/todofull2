require('dotenv-safe').config();
const mongoose = require('mongoose');
const initMongo = require('./config/mongo');
const ContactsPercentage = require('./models/ContactsPercentages');
const Contacto = require('./models/Contactos');
initMongo();

(async () => {
  // await Contacto.deleteMany({ telefonoId: '5fd40c58d777420017eb224e' });
  // console.log('hecho!');
  // await ContactsPercentage.findOneAndDelete({
  //   telefonoId: '5fd40c58d777420017eb224e',
  // });
  // console.log('hecho');
  let collectionName = 'MailchimpContacts'.toLowerCase();
  // let collectionName = 'Contactos'.toLowerCase();
  // let collectionName2 = 'ContactsPercentages'.toLowerCase();
  // ContactsPercentage.find().then((items) => console.log(items));
  await mongoose.connection.dropCollection(collectionName);
  // await mongoose.connection.dropCollection(collectionName2);
  console.log('se eliminó: ', collectionName);
  // console.log('se eliminó: ', collectionName2);
  // console.log('se eliminó: ', collectionName2);
})();
