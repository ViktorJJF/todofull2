require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const EcommercesContacts = require('./models/EcommercesContacts');

//Eliminar los que no tengan nombres telefono ciudad
(async () => {
  let contacts = await EcommercesContacts.find();
  // console.log('los contactos:', contacts);
  for (const contact of contacts) {
    try {
      if (
        contact.first_name.length == 0 &&
        contact.phone.length == 0 &&
        contact.city.length == 0
      ) {
        let contactDB = await EcommercesContacts.findOne({
          idContact: contact.idContact,
        });
        contactDB.remove();
        console.log(contactDB.email);
      }
    } catch (error) {
      console.log('el error: ', error);
    }
  }
  console.log('fin....');
})();
