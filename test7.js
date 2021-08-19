require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const { random, fuzzyPhoneSearch } = require('./helpers/utils');
const { formatPhone } = require('./helpers/utils2');
const { checkQueryString, getItems2, getItem } = require('./helpers/db');
const Contactos = require('./models/Contactos');
const EcommercesContacts = require('./models/EcommercesContacts');
const CleanLeads = require('./models/CleanLeads');
const Woocommerce = require('./models/Woocommerces');
const Telefono = require('./models/Telefonos');
(async () => {
  let cleanLeads = await CleanLeads.find({}).sort({ createdAt: -1 });
  for (const cleanLead of cleanLeads) {
    if (cleanLead.telefonoId && cleanLead.telefonoId._id) {
      let contacto = await fuzzyPhoneSearch(
        cleanLead.telefono,
        'celular',
        Contactos,
      );
      if (contacto) {
        //el contacto existe en contacts
        console.log('existe en contacts', cleanLead.telefono);
      } else {
        console.log('no existe en contacts', cleanLead.telefono);
        console.log('asignando agente: ', cleanLead.telefonoId._id);
        console.log(
          'agregare estos datos: ',
          cleanLead.details[0].nombre,
          '',
          formatPhone(cleanLead.telefono),
          cleanLead.details[0].email,
          cleanLead.telefonoId._id,
        );
        addLeadGoogleContact(
          cleanLead.details[0].nombre,
          '',
          formatPhone(cleanLead.telefono),
          cleanLead.details[0].email,
          cleanLead.telefonoId._id,
        );
      }
    }
  }
  console.log('hecho!! FIN');
})();

async function addLeadGoogleContact(
  firstName,
  lastName,
  telefono,
  email,
  telefonoId,
) {
  console.log('agregando a google contact...');
  try {
    await axios.post(process.env.API_URL + '/api/contactos', {
      celular: telefono,
      nombre: firstName,
      apellido: lastName,
      email,
      telefonoId,
    });
    console.log('agregado con exito');
  } catch (error) {}
}
