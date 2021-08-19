const { google } = require('googleapis');
const Contact = require('../models/Contactos');

const oauth2Client = new google.auth.OAuth2(
  '746067117499-drfplv77rln9qu8knaibcicmel3n7ekk.apps.googleusercontent.com',
  'h-AxBkVI88U9D3A9gV6EdRte',
  'http://localhost',
);
// const { tokens } = await oauth2Client.getToken(
//   '4/0AY0e-g4kjpVb5FWICzcTpRtaySZt93u3fA9j9XDNVsOlDj1dWh15HD5vxRp-J18hbhAxQQ',
// );
const tokens = {
  access_token:
    'ya29.a0AfH6SMD_kOZivM5SCos4ckIPj_UGeU2m_z6YLaPmjSbNTgPv981FNiTCYzT1b-35Dlf9B9woBVRCUNBZ73kHxX59zdrLG4iRyJLgr1chkuw8CxyXuI2sOgz5jVfez3f1yk9bsdvFgBPUzpVw-oxH7KB3BSYSoidzoRCp2_mJ-EM',
  refresh_token:
    '1//0dnY7Mb3t66mCCgYIARAAGA0SNwF-L9IrYslYtd4A49gzRdVoZlIFeq1F6A3GyilxKdS2IEskwDCp_UGtxLVigpNi5Qb96Z-jBgY',
  scope:
    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts.other.readonly https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/user.emails.read https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/directory.readonly openid',
  token_type: 'Bearer',
  id_token:
    'eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxOTdiZjJlODdiZDE5MDU1NzVmOWI2ZTVlYjQyNmVkYTVkNTc0ZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3NDYwNjcxMTc0OTktZHJmcGx2NzdybG45cXU4a25haWJjaWNtZWwzbjdla2suYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3NDYwNjcxMTc0OTktZHJmcGx2NzdybG45cXU4a25haWJjaWNtZWwzbjdla2suYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUxMDcyNjg2OTQ5NjY5MDMwNTciLCJoZCI6ImRvc3NpbC5jb20uY28iLCJlbWFpbCI6ImRhcmRpZ25hY0Bkb3NzaWwuY29tLmNvIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJEYW5oUzJ1cVB2RDlqLUNpclc2eUZnIiwibmFtZSI6IkxvY2FsIERhcmRpbmFjIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS8td3c2S0xzdVpqSUkvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQUEvQU1adXVja0NlN25HeFBpNEtvZUwxaVpwYndYZ3lQeW0yQS9zOTYtYy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoiTG9jYWwiLCJmYW1pbHlfbmFtZSI6IkRhcmRpbmFjIiwibG9jYWxlIjoiZXMtNDE5IiwiaWF0IjoxNjA4NDg2MjMwLCJleHAiOjE2MDg0ODk4MzB9.WYeJE5C0oT5u7AfJSpCGGxxwzTXHXh1uyjn3o3feOB6QFJaY14aHj3gjh4O2HBUh5XZDyjxahasGtcxClawsugyTpre0RXjdxNllwzvxYw95R-S40s5_JnG4nYnqBr3piXRjOWRfveYJTisBX4ZXo5FUtNdjnKoGjLikzPrD1E6HaKV2CFoxC3ytKNo9sHo9dkPy5IUR9_c6IIvndRI_pP62GkSfJLIFtWBHlx8Wg3EF3ae5cM-Q-4fc0KLOn6yjifFktK1G52n7ncgQ8sFw23xf4YZ8Ua_Bd0_HVxAEl7l6Z-nECVRqPYUkdp1dizWaMy-uc4OgQIDDRmRjqOxMWQ',
  expiry_date: 1608489829075,
};
// console.log('los tokens: ', tokens);
oauth2Client.setCredentials(tokens);

const people = google.people({
  version: 'v1',
  auth: oauth2Client,
});

(async () => {
  (async () => {
    obtenerContactos(true, null);
  })();
})();

async function obtenerContactos(first, nextPageToken) {
  console.log('siguiente token: ', nextPageToken);
  if (first || nextPageToken) {
    try {
      let body = {
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers',
        // fields: 'connections,totalItems,nextSyncToken',
      };
      if (nextPageToken) body['pageToken'] = nextPageToken;
      let res = await people.people.connections.list(body);
      for (const resource of res.data.connections) {
        // console.log('guardare: ', {
        //   celular: resource.phoneNumbers
        //     ? resource.phoneNumbers[0].canonicalForm
        //     : null,
        //   nombre: resource.names ? resource.names[0].middleName : null,
        //   apellido: resource.names ? resource.names[0].familyName : null,
        //   resourceName: resource.resourceName,
        //   telefonoId: '5fd40d1dd777420017eb2251',
        // });
        let contact = new Contact({
          celular: resource.phoneNumbers
            ? resource.phoneNumbers[0].canonicalForm
            : null,
          nombre: resource.names ? resource.names[0].middleName : null,
          apellido: resource.names ? resource.names[0].familyName : null,
          resourceName: resource.resourceName,
          telefonoId: '5fd40d1dd777420017eb2251',
        });
        contact.save((err, payload) => {
          if (err) {
            console.log('salio este error:', err);
          }
          // console.log('contacto creado exitosamente...');
        });
      }
      //nuevamente?
      await obtenerContactos(null, res.data.nextPageToken);
    } catch (error) {
      console.log('el error:', error);
    }
  } else {
    return 0;
  }
}
