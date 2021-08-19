require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const { random } = require('./helpers/utils');
const { checkQueryString, getItems2, getItem } = require('./helpers/db');
const Contacto = require('./models/Contactos');
const EcommercesContacts = require('./models/EcommercesContacts');
const CleanLeads = require('./models/CleanLeads');
const Woocommerce = require('./models/Woocommerces');
const Telefono = require('./models/Telefonos');
(async () => {
  let woocommerces = await Woocommerce.find({}); //paginas woocommerce
  let cleanLeads = await CleanLeads.find({});
  let contact = await EcommercesContacts.find({
    createdAt: { $gte: '2021-05-21T01:01:48.807Z' },
  });
  contact = contact.filter((el) => el.phone && el.phone != '');
  for (let i = 0; i < contact.length; i++) {
    var cleanLead = cleanLeads.find((el) =>
      el.telefono
        .replace('56', '')
        .replace(/\s+/g, '')
        .replace('+', '')
        .replace('-', '')
        .includes(
          contact[i].phone
            .replace('56', '')
            .replace('+', '')
            .replace('-', '')
            .replace(/\s+/g, ''),
        ),
    );
    if (cleanLead) {
      console.log('existe lead...agregar fuente');
      // if (leadsMatch.some((el) => el.fuente != leadsMatch[0].fuente))
      // console.log('los repetidos: ', leadsMatch);
      let sameFuente = cleanLead.details.find(
        (el) => el.fuente == getFuente(contact[i].url),
      );
      if (getFuente(contact[i].url) && !sameFuente)
        cleanLead.details.push({
          type: 'PAGINA',
          fuente: getFuente(contact[i].url),
          msnActivaDefault: '',
          nombre: contact[i].first_name + ' ' + contact[i].last_name,
          email: contact[i].email,
          ciudad: contact[i].city,
          labels: [],
          pais: contact[i].country,
        });
      else {
        console.log('editando fuente....');
        if (sameFuente.type == 'PAGINA') {
          let fullname = contact[i].first_name + ' ' + contact[i].last_name;
          if (fullname.length > sameFuente.nombre) sameFuente.nombre = fullname;
          if (contact[i].email && contact[i].email.length > 0)
            sameFuente.email = contact[i].email;
          if (contact[i].ciudad && contact[i].ciudad.length > 0)
            sameFuente.ciudad = contact[i].city;
        }
      }
      await cleanLead.save();
      console.log('agregado nuevo detail!!');
    } else {
      let leadDB = new CleanLeads({
        details: [
          {
            type: 'PAGINA',
            fuente: getFuente(contact[i].url),
            msnActivaDefault: '',
            nombre: contact[i].first_name + ' ' + contact[i].last_name,
            email: contact[i].email,
            ciudad: contact[i].city,
            labels: [],
            pais: contact[i].country,
          },
        ],
        estado: 'RE-CONECTAR',
        telefono: contact[i].phone
          .replace('+', '')
          .replace(/\s+/g, '')
          .replace('-', ''),
        telefonoId: await assignAgent(
          contact[i].phone,
          getFuente(contact[i].url),
          woocommerces,
          contact[i].first_name + ' ' + contact[i].last_name,
          contact[i].email,
        ), //asignando agente
      });
      await leadDB.save();
      console.log('creado lead clean! ');
    }
  }
  // await CleanLeads.insertMany(cleanLeads);
  console.log('hecho!! FIN');
})();

function getFuente(domain) {
  let fuentes = {
    'https://mujeron.cl': '6014941a32389f4af462d478',
    'https://fajassalome.cl': '6014b7a0bffbfd0017c1c2f2',
    'https://mujeron.pe': '6014b781bffbfd0017c1c2ef',
    'https://pushup.cl': '6014b794bffbfd0017c1c2f1',
  };
  return fuentes[domain];
}

async function assignAgent(telefono, fuente, woocommerces, fullname, email) {
  let telefonoId;
  //buscando si el telefono del lead está asignado a algun agentee
  let query = await checkQueryString({
    filter: telefono
      .replace('56', '')
      .replace('+', '')
      .replace(/\s+/g, '')
      .replace('-', ''),
    fields: 'celular',
  });
  let googleContactAgents = await getItems2(Contacto, query);
  if (googleContactAgents.length > 0) {
    //el numero lo tienen varios agentes
    let admin = googleContactAgents.find((el) =>
      woocommerces.find(
        (woocommerce) => woocommerce.telefonoId == el.telefonoId._id,
      ),
    );
    if (admin) {
      console.log('es admin: ', admin.telefonoId._id);
      // createChatbotLead(admin.telefonoId._id);
      telefonoId = admin.telefonoId._id;
    } else {
      if (googleContactAgents.length == 1) {
        console.log('pertenece a 1:', googleContactAgents[0].telefonoId._id);
        telefonoId = googleContactAgents[0].telefonoId._id;
        // createChatbotLead(googleContactAgents[0].telefonoId._id);
      } else {
        console.log('pertenece a 2 o mas...');
        let randomGoogleContactAgent =
          googleContactAgents[random(0, googleContactAgents.length - 1)];
        console.log(
          'el random seleccionado: ',
          randomGoogleContactAgent.telefonoId._id,
        );
        telefonoId = randomGoogleContactAgent.telefonoId._id;
        // createChatbotLead(randomGoogleContactAgent.telefonoId._id);
      }
    }
  } else {
    //el numero no lo tenia ningun agente, asignando admin
    telefonoId = woocommerces.find((woocommerce) => woocommerce._id == fuente)
      .telefonoId._id;
    console.log('admin asignado...', telefonoId);
    addLeadGoogleContact(fullname, telefono, email, telefonoId);
  }
  return telefonoId;
}

async function addLeadGoogleContact(fullname, telefono, email, telefonoId) {
  console.log('agregando a google contact...');
  try {
    let credentials = (await getItem(telefonoId, Telefono)).payload
      .credenciales;
    await axios.post(
      process.env.API_URL + '/api/google-people/contacts/create',
      {
        ...credentials,
        requestBody: {
          names: [
            {
              familyName: '',
              middleName: '',
              givenName: fullname,
            },
          ],
          phoneNumbers: [{ value: telefono }],
          emailAddresses: [{ value: email }],
        },
      },
    );
    console.log('agregado con exito');
  } catch (error) {}
}
