require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const FacebookLabels = require('./models/FacebookLabels');

let FB_TOKEN =
  'EAACz4O8562MBACp1hIoosqgx3AbBenDW3aKl9zzYjZB2fMVZAzYe7E7ebPvbIgGfmyTZC9De5r5YBLSXswxOXy7YHwFcA86GcXLZAHjpBTC1sJiYqllWHJUQaLEZAI5ARcXosEp19tGYqI1QgkaQ0zcd4hWGaHfNsOAJZCjK2WQkOZCr8i8XqJd8BMGPk00lxIZD';
let fanpageId = 136093159756841;

(async () => {
  try {
    let res = await axios(
      `https://graph.facebook.com/v9.0/106010543307522/custom_labels?access_token=EAACz4O8562MBACp1hIoosqgx3AbBenDW3aKl9zzYjZB2fMVZAzYe7E7ebPvbIgGfmyTZC9De5r5YBLSXswxOXy7YHwFcA86GcXLZAHjpBTC1sJiYqllWHJUQaLEZAI5ARcXosEp19tGYqI1QgkaQ0zcd4hWGaHfNsOAJZCjK2WQkOZCr8i8XqJd8BMGPk00lxIZD&pretty=0&fields=name&limit=200&after=MTk5`,
    );
    await FacebookLabels.insertMany(
      res.data.data.map((el) => ({
        idLabel: el.id,
        name: el.name,
        fanpageId: '136093159756841',
      })),
    );
    console.log('hecho!');
  } catch (error) {
    console.log('error->', error);
  }
})();
