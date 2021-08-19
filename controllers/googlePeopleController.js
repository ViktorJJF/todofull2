const utils = require('../helpers/utils');
const { google } = require('googleapis');
const Contacto = require('../models/Contactos');
const ContactPercentage = require('../models/ContactsPercentages');
const db = require('../helpers/db');
const { body } = require('trim-request');

let percentages = []; //porcentajes de exportacion de contactos

const generateURL = async (req, res) => {
  try {
    let clientId = req.body.clientId;
    let clientSecret = req.body.clientId;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost',
    );

    // generate a url that asks permissions for Blogger and Google Calendar scopes
    const scopes = [
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/user.emails.read',
      'https://www.googleapis.com/auth/directory.readonly',
      'https://www.googleapis.com/auth/contacts.other.readonly',
    ];

    const url = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      prompt: 'consent',

      // If you only need one scope you can pass it as a string
      scope: scopes,
    });
    res.status(200).json({ msg: 'URL generada exitosamente', payload: url });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const generateTokens = async (req, res) => {
  try {
    let code = req.body.code;
    let clientId = req.body.clientId;
    let clientSecret = req.body.clientSecret;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost',
    );
    const { tokens } = await oauth2Client.getToken(code);
    res
      .status(200)
      .json({ msg: 'Tokens generados con éxito', payload: tokens });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const contactsPreview = async (req, res) => {
  try {
    let access_token = req.body.access_token;
    let refresh_token = req.body.refresh_token;
    let scope = req.body.scope;
    let token_type = req.body.token_type;
    let id_token = req.body.id_token;
    let expiry_date = req.body.expiry_date;
    let tokens = {
      access_token,
      refresh_token,
      scope,
      token_type,
      id_token,
      expiry_date,
    };
    let clientId = req.body.clientId;
    let clientSecret = req.body.clientSecret;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost',
    );
    oauth2Client.setCredentials(tokens);
    const people = google.people({
      version: 'v1',
      auth: oauth2Client,
    });
    let resPeople = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,phoneNumbers',
      // fields: 'connections,totalItems,nextSyncToken',
    });
    res.status(200).json({
      msg: 'Vista previa generada con èxito',
      payload: {
        connections: resPeople.data.connections,
        nextPageToken: resPeople.data.nextPageToken,
        totalPeople: resPeople.data.totalPeople,
        totalItems: resPeople.data.totalItems,
      },
    });
  } catch (error) {
    console.log('el error: ', error);
    utils.handleError(res, error);
  }
};

const contactsExport = async (req, res) => {
  try {
    let telefonoId = req.body.telefonoId;
    let contactPercentages = (
      await db.filterItems({ telefonoId }, ContactPercentage)
    ).payload;
    if (contactPercentages.length > 0) {
      if (contactPercentages[0].error && contactPercentages[0].nextPageToken) {
        //cambiando error a false y ejecutando ...
        let updated = (
          await db.updateItem(contactPercentages[0]._id, ContactPercentage, {
            error: false,
          })
        ).payload;
        beginExport(updated, req, updated.nextPageToken);
      }
      res.status(200).json({
        ok: true,
        payload: contactPercentages[0],
      });
    } else {
      let contactPercentage = (
        await db.createItem(
          {
            telefonoId: telefonoId,
            itemsExported: 0,
            percentage: 0,
            nextPageToken: null,
            error: false,
          },
          ContactPercentage,
        )
      ).payload;
      beginExport(contactPercentage, req);
      res.status(200).json({ ok: true, payload: contactPercentage });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

async function beginExport(contactPercentage, req, nextPageToken) {
  if (!contactPercentage.error) {
    try {
      let telefonoId = req.body.telefonoId;
      let access_token = req.body.access_token;
      let refresh_token = req.body.refresh_token;
      let scope = req.body.scope;
      let token_type = req.body.token_type;
      let id_token = req.body.id_token;
      let expiry_date = req.body.expiry_date;
      let tokens = {
        access_token,
        refresh_token,
        scope,
        token_type,
        id_token,
        expiry_date,
      };
      let clientId = req.body.clientId;
      let clientSecret = req.body.clientSecret;
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost',
      );
      oauth2Client.setCredentials(tokens);
      const people = google.people({
        version: 'v1',
        auth: oauth2Client,
      });

      let body = {
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers',
      };
      if (nextPageToken) body['pageToken'] = nextPageToken;

      var resPeople = await people.people.connections.list(body);
      let contactos = resPeople.data.connections.map((connection) => ({
        celular: connection.phoneNumbers
          ? connection.phoneNumbers[0].canonicalForm
            ? connection.phoneNumbers[0].canonicalForm.replace('+', '')
            : null
          : null,
        nombre: connection.names ? connection.names[0].givenName : null,
        segundoNombre: connection.names ? connection.names[0].middleName : null,
        apellido: connection.names ? connection.names[0].familyName : null,
        displayName: connection.names ? connection.names[0].displayName : null,
        resourceName: connection.resourceName,
        etag: connection.etag,
        telefonoId,
      }));
      await Contacto.insertMany(contactos);
      let updated = (
        await db.updateItem(contactPercentage._id, ContactPercentage, {
          itemsExported: contactPercentage.itemsExported + contactos.length,
          percentage: parseInt(
            ((contactPercentage.itemsExported + contactos.length) /
              resPeople.data.totalPeople) *
              100,
          ),
          totalItems: resPeople.data.totalPeople,
        })
      ).payload;

      if (resPeople.data.nextPageToken) {
        await beginExport(updated, req, resPeople.data.nextPageToken);
      } else {
        console.log('finalizado...');
        return 0;
      }
    } catch (error) {
      console.log('ocurrio un error y se detuvo todo...:', error.message);
      console.log('fin del error...:', nextPageToken);
      if (error.message.includes('E11000 duplicate key error collection')) {
        //continuar con el siguiente pagetoken
        console.log(
          'continuando con el siguiente token: ',
          resPeople.data.nextPageToken,
        );
        beginExport(contactPercentage, req, resPeople.data.nextPageToken);
      } else {
        //otro error que gestionar...
        await db.updateItem(contactPercentage._id, ContactPercentage, {
          nextPageToken: nextPageToken,
          error: true,
        });
      }
    }
  } else {
    console.log('se dio error ...');
  }
}

const contactsCreate = async (req, res) => {
  try {
    let requestBody = req.body.requestBody;
    console.log('creare este contacto: ', requestBody);
    let access_token = req.body.access_token;
    let refresh_token = req.body.refresh_token;
    let scope = req.body.scope;
    let token_type = req.body.token_type;
    let id_token = req.body.id_token;
    let expiry_date = req.body.expiry_date;
    let tokens = {
      access_token,
      refresh_token,
      scope,
      token_type,
      id_token,
      expiry_date,
    };
    let clientId = req.body.clientId;
    let clientSecret = req.body.clientSecret;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost',
    );
    oauth2Client.setCredentials(tokens);
    const people = google.people({
      version: 'v1',
      auth: oauth2Client,
    });
    let resPeople = await people.people.createContact({
      requestBody,
    });
    res.status(200).json({
      msg: 'Contacto creado con éxito',
      payload: resPeople.data,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const contactsUpdate = async (req, res) => {
  try {
    let resourceName = req.body.resourceName;
    let updatePersonFields =
      req.body.updatePersonFields || 'names,phoneNumbers,emailAddresses';
    let requestBody = req.body.requestBody;
    let access_token = req.body.access_token;
    let refresh_token = req.body.refresh_token;
    let scope = req.body.scope;
    let token_type = req.body.token_type;
    let id_token = req.body.id_token;
    let expiry_date = req.body.expiry_date;
    let tokens = {
      access_token,
      refresh_token,
      scope,
      token_type,
      id_token,
      expiry_date,
    };
    let clientId = req.body.clientId;
    let clientSecret = req.body.clientSecret;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost',
    );
    oauth2Client.setCredentials(tokens);
    const people = google.people({
      version: 'v1',
      auth: oauth2Client,
    });
    let resPeople = await people.people.updateContact({
      updatePersonFields,
      resourceName,
      requestBody,
    });
    res.status(200).json({
      msg: 'Contacto actualizado con exito',
      payload: resPeople.data,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

const contactsDelete = async (req, res) => {
  try {
    let resourceName = req.body.resourceName;
    let access_token = req.body.access_token;
    let refresh_token = req.body.refresh_token;
    let scope = req.body.scope;
    let token_type = req.body.token_type;
    let id_token = req.body.id_token;
    let expiry_date = req.body.expiry_date;
    let tokens = {
      access_token,
      refresh_token,
      scope,
      token_type,
      id_token,
      expiry_date,
    };
    let clientId = req.body.clientId;
    let clientSecret = req.body.clientSecret;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost',
    );
    oauth2Client.setCredentials(tokens);
    const people = google.people({
      version: 'v1',
      auth: oauth2Client,
    });
    let resPeople = await people.people.deleteContact({ resourceName });
    res.status(200).json({
      msg: 'Contacto eliminado con exito',
      payload: resPeople.data,
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

module.exports = {
  generateURL,
  generateTokens,
  contactsPreview,
  contactsExport,
  contactsCreate,
  contactsDelete,
  contactsUpdate,
};
