const { google } = require('googleapis');
const Telefono = require('../models/Telefonos');
const Contacto = require('../models/Contactos');
const ContactsPercentage = require('../models/ContactsPercentages');

async function beginSyncGooglePeople() {
  console.log('sincronizando. ');
  let telefonos = await Telefono.find();
  for (const telefono of telefonos) {
    // if (telefono.numero === '51983724476')
    // if (telefono._id == '5fd4097fd777420017eb2249')
    compareQty(telefono._id, telefono.credenciales);
  }
}

async function compareQty(telefonoId, credentials) {
  try {
    let count = await Contacto.countDocuments({ telefonoId });
    let googlePeopleCount = await getGooglePeopleQty(credentials);
    let percentage = await ContactsPercentage.findOne({ telefonoId });
    // console.log('el porcentage: ', percentage.percentage);
    // console.log('el conteo de google: ', googlePeopleCount.totalItems);
    // console.log('el conteo de mongo: ', telefonoId, count);
    let contactsDiff = googlePeopleCount.totalItems - count;
    if (percentage.percentage >= 99 && contactsDiff > 0) {
      // console.log('agregaré nuevos contactos: ', contactsDiff);
      // console.log('trayendo contactos del telefono id: ', telefonoId);
      // console.log(
      //   'los contactos: ',
      //   JSON.stringify(googlePeopleCount.connections, null, ' '),
      // );
      let contactsToAdd = googlePeopleCount.connections
        // .slice(0, contactsDiff)
        .map((connection) => ({
          celular: connection.phoneNumbers
            ? connection.phoneNumbers[0].canonicalForm
              ? connection.phoneNumbers[0].canonicalForm.replace('+', '')
              : null
            : null,
          nombre: connection.names ? connection.names[0].givenName : null,
          segundoNombre: connection.names
            ? connection.names[0].middleName
            : null,
          apellido: connection.names ? connection.names[0].familyName : null,
          displayName: connection.names
            ? connection.names[0].displayName
            : null,
          resourceName: connection.resourceName,
          etag: connection.etag,
          telefonoId,
        }));
      // console.log(contactsToAdd);
      // await Contacto.insertMany(contactsToAdd);
      for (const contactToAdd of contactsToAdd) {
        let contacto = new Contacto(contactToAdd);
        contacto
          .save()
          .then((res) => {})
          .catch((err) => {
            // console.log(contacto, err);
          });
        // console.log('contacto exportado...');
      }
    }
  } catch (error) {
    // console.log('error. ', error.message);
  }
}

async function getGooglePeopleQty(credentials) {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    'http://localhost',
  );
  oauth2Client.setCredentials(credentials);
  const people = google.people({
    version: 'v1',
    auth: oauth2Client,
  });

  let res = await people.people.connections.list({
    pageSize: 100,
    resourceName: 'people/me',
    personFields: 'names,emailAddresses,phoneNumbers',
    sortOrder: 'LAST_MODIFIED_DESCENDING',
  });
  return { totalItems: res.data.totalItems, connections: res.data.connections };
}

(async () => {
  while (true) {
    try {
      beginSyncGooglePeople();
      await timeout(5 * 60 * 1000);
    } catch (error) {
      // console.log('algo salio mal...', error);
    }
  }
})();

function timeout(millis) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, millis);
  });
}
