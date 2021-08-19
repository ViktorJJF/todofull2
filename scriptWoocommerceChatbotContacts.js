require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const extractDomain = require('extract-domain');
const EcommercesContact = require('./models/EcommercesContacts');
const Contacto = require('./models/Contactos');
const cleanLead = require('./models/CleanLeads');
const Woocommerce = require('./models/Woocommerces');
const Telefono = require('./models/Telefonos');
const { checkQueryString, getItems2 } = require('./helpers/db');
const { random, searchCleanLead } = require('./helpers/utils');
(async () => {
  let cleanLeads = [];
  let leads = await CleanLeads.find({}).sort({ createdAt: -1 });
  console.log('leads: ', JSON.stringify(leads, null, ' '));
  for (let i = 0; i < leads.length; i++) {
    var cleanLead = cleanLeads.find((el) =>
      el.telefono
        .replace('56', '')
        .replace(/\s+/g, '')
        .includes(leads[i].telefono.replace('56', '').replace(/\s+/g, '')),
    );
    if (cleanLead) {
      console.log('existe lead...agregar fuente');
      // if (leadsMatch.some((el) => el.fuente != leadsMatch[0].fuente))
      // console.log('los repetidos: ', leadsMatch);
      let sameFuente = cleanLead.details.find(
        (el) => el.fuente == leads[i].fuente,
      );
      if (leads[i].fuente && !sameFuente)
        cleanLead.details.push({
          contactId: leads[i].contactId,
          fuente: leads[i].fuente,
          msnActivaDefault: leads[i].msnActivaDefault,
          appName: leads[i].appName,
          nombre: leads[i].nombre,
          email: leads[i].email,
          ciudad: leads[i].ciudad,
          nota: leads[i].nota,
          labels: leads[i].labels,
          pais: leads[i].pais,
        });
      // await cleanlead.save();
      console.log('agregado!!');
    } else {
      console.log('crear clean lead');
      let leadDB = new CleanLeads({
        details: [
          {
            contactId: leads[i].contactId,
            fuente: leads[i].fuente,
            msnActivaDefault: leads[i].msnActivaDefault,
            appName: leads[i].appName,
            nombre: leads[i].nombre,
            email: leads[i].email,
            ciudad: leads[i].ciudad,
            nota: leads[i].nota,
            labels: leads[i].labels,
            pais: leads[i].pais,
          },
        ],
        estado: leads[i].estado,
        telefono: leads[i].telefono,
        telefonoId: leads[i].telefonoId ? leads[i].telefonoId._id : null, //asignando agente
      });
      console.log('creado lead clean! ');
      cleanLeads.push(leadDB);
    }
    console.log('el array tamaño: ', cleanLeads.length);
  }
  await CleanLeads.insertMany(cleanLeads);
  console.log('hecho!! FIN');
})();
