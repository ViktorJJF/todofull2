const { google } = require('googleapis');
const fs = require('fs');
// const auth = new google.auth.GoogleAuth({
//   keyFile: './credenciales/sincere-scheme-293422-c9adfc69861e.json',
//   scopes: [
//     'https://www.googleapis.com/auth/contacts',
//     // 'https://www.googleapis.com/auth/contacts.readonly',
//     'https://www.googleapis.com/auth/userinfo.email',
//     'https://www.googleapis.com/auth/userinfo.profile',
//     'https://www.googleapis.com/auth/user.emails.read',
//     'https://www.googleapis.com/auth/directory.readonly',
//     'https://www.googleapis.com/auth/contacts.other.readonly',
//   ],
// });

(async () => {
  const oauth2Client = new google.auth.OAuth2(
    '241006030021-fi6rgh5rn3t1bbhrkfri6l2n35p14vdr.apps.googleusercontent.com',
    'n5ETjaA_bzLR1qWGOaxp_3RA',
    'http://localhost',
  );
  // const { tokens } = await oauth2Client.getToken(
  //   '4/0AY0e-g5jDTKuBrc_B-fFZ-ekZzcEp1nIPhfpQNNRDURZUiSPHeT2_RnAC3RQBF0YsPDb9g',
  // );
  const tokens = {
    access_token:
      'ya29.a0AfH6SMCiep37AdiKqHUxlrNyX6Zhv65-JGnYcZPHSRp6H8p5F4-zEze3gJwifawW_FOLJdQEtCkU47r3iCgqddf2mfU7mkP6SA7rQKcs_Gl0obKV4KTqce_zG8gvYl07ToSB9U4j8y4TAZwotaReUCaADAiwCfzk-hOJiS2ZVQA',
    refresh_token:
      '1//05rxlG2D3abLeCgYIARAAGAUSNwF-L9Ir43pbRDKFOFXdduSoKaAYl6-JtEAnUZew_oVNZQO8Icofq5-1W3J2c599bB6iZ5jFk_M',
    scope:
      'https://www.googleapis.com/auth/contacts.other.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/directory.readonly https://www.googleapis.com/auth/contacts openid https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/user.emails.read',
    token_type: 'Bearer',
    id_token:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1MmZjYjk3ZGY1YjZiNGY2ZDFhODg1ZjFlNjNkYzRhOWNkMjMwYzUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyNDEwMDYwMzAwMjEtZmk2cmdoNXJuM3QxYmJocmtmcmk2bDJuMzVwMTR2ZHIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyNDEwMDYwMzAwMjEtZmk2cmdoNXJuM3QxYmJocmtmcmk2bDJuMzVwMTR2ZHIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTY0Nzc3NzgyODg1MTQ2MTI5NTkiLCJlbWFpbCI6InZqLmppbWVuZXo5NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6Ims2eVdZWDA0cWZLazVqTWJzbE12aXciLCJuYW1lIjoiVsOtY3RvciBKdWFuIEppbWVuZXogRmxvcmVzIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdqQ1VxeHpKUGdMOENPcGlfeDdiYUQzQUc3V2lVTmtaaFVFdTZGVmR3PXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlbDrWN0b3IgSnVhbiIsImZhbWlseV9uYW1lIjoiSmltZW5leiBGbG9yZXMiLCJsb2NhbGUiOiJlcy00MTkiLCJpYXQiOjE2MDk4ODc5NjgsImV4cCI6MTYwOTg5MTU2OH0.UpQ5vRGtk7Xq-vHLJrz53ceRzUDoK9QiQwf6LDIDMUBVPWcaejqLZDHFa7Dialnl9AEA_uz0dvBcW5JNs6yG8wMixVE7DzwYxM4OkDfahqcMDFxUZBHr9-vfDIsO_YSLtzNA1eZgsTciR0jIfs-tE9UfLVPNft9MisE494fEaVmI3LvQQK9HU66Weufwd15xEPYIofQk-0Vxy7R6rbaQW64VDboBdO00pc8f3vhkDTwbyf5f_Rl-q7hDz_cnoAca5Dkzdl00pPXyHzS6RPogya_WNUiHYGY4SKa5vR2KeFZsLAHrB7M_y-dm7qLot2cKWWYkvFSON2NLqXZI4kOqRA',
    expiry_date: 1609891568125,
  };
  // console.log('los tokens: ', tokens);
  oauth2Client.setCredentials(tokens);

  const people = google.people({
    version: 'v1',
    auth: oauth2Client,
  });

  (async () => {
    try {
      // let res = await people.people.get({
      //   resourceName: 'people/c7113930915816979688',
      //   personFields: 'names',
      // });
      let res = await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers',
        pageToken: 'CAAQpqaNt-ouGgcKAwiEBxAC',
      });
      //listar etiquetas
      // let res = await people.contactGroups.list();
      // let res = await people.contactGroups.get({
      //   resourceName: 'contactGroups/myContacts',
      //   // personFields: 'names',
      // });
      // let res = await people.contactGroups.get({
      //   resourceName: 'contactGroups/3d12cd78f1d0114',
      //   maxMembers: 99999,
      // });
      // let res = await people.otherContacts.list({
      //   readMask: 'names',
      // });
      // let res = await people.people.listDirectoryPeople({
      //   readMask: 'names',
      //   mergeSources: 'DIRECTORY_MERGE_SOURCE_TYPE_CONTACT',
      // });
      // let res = await people.people.connections.list({
      //   resourceName: 'people/me',
      //   personFields: 'names',
      //   // pageToken:'CAAQ64vblOcuGgYKAghkEAI'
      // });
      // console.log('la respuesta larga: ', res);
      /*Metodos People*/
      //informacion de 1 persona
      // let res = await people.people.get({
      //   resourceName: 'people/c7791259814702748885',
      //   personFields: ['names', 'phoneNumbers', 'emailAddresses'],
      // });
      //informacion de multiples personas
      // let res = await people.people.getBatchGet({
      //   resourceNames: [
      //     'people/c6015214078194409564',
      //     'people/c7791259814702748885',
      //   ],
      //   personFields: ['names', 'phoneNumbers', 'emailAddresses'],
      // });
      // fs.writeFileSync('peopleOutput.json', JSON.stringify(res.data));
      // console.log('la respuesta: ', JSON.stringify(res.data, null, ' '));
    } catch (error) {
      // console.log('el error:', error);
    }
  })();
})();
