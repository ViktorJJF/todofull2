const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  '241006030021-fi6rgh5rn3t1bbhrkfri6l2n35p14vdr.apps.googleusercontent.com',
  'n5ETjaA_bzLR1qWGOaxp_3RA',
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

console.log('la url: ', url);
