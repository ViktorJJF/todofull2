require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const Lead = require('./models/Leads');

(async () => {
  await Lead.updateMany(
    { fuente: '600c8c970972780017a7583f' },
    { pais: 'Chile' },
  );
  console.log('hecho!');
})();
