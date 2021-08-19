const faker = require('faker');

faker.locale = 'es_MX';
const json = [];

// Data
// for (let i = 0; i < 2; i++) {
json.push({
  role: 'ADMIN',
  status: true,
  first_name: 'Victor Juan',
  last_name: 'Jimenez Flores',
  password: '$2b$05$ESBSlw8CwQMv.gcns.dDUuuV7TLsoLyZkoKg6R5VmwAPP7kF3ryH.',
  email: 'vj@gmail.com',
});
// }
// END DATA

module.exports = new Promise(async (resolve) => {
  resolve(json);
});
