require('dotenv-safe').config();
const initMongo = require('./config/mongo');

initMongo();
const axios = require('axios');
const EcommercesCategory = require('./models/EcommercesCategories');

let BASE_URL = 'https://mujeron.pe';
const USERNAME = 'ck_8daab84dca6302e69a953ed7bb5b52e0c7fad4d1';
const PASSWORD = 'cs_153bcca7bf6e973369d15ea74b71d4a74db07ca0';
let buff = new Buffer(`${USERNAME}:${PASSWORD}`);
let base64data = buff.toString('base64');

(async () => {
  let categoriesDB = await EcommercesCategory.find().lean();
  let categories = [];
  try {
    let res = await axios({
      method: 'get',
      url: `${BASE_URL}/wp-json/wc/v3/products/categories?page=1&per_page=100`,
      withCredentials: true,
      headers: {
        Authorization: `Basic ${base64data}`,
      },
    });
    for (const category of res.data) {
      let categoryToDB = {
        idCategory: category.id,
        name: category.name,
        slug: category.slug,
        parent: category.parent,
        menu_order: category.menu_order,
        url: getUrl(category.yoast_head),
        country: 'Chile',
      };
      if (
        categoriesDB.findIndex(
          (el) => el.idCategory == categoryToDB.idCategory,
        ) == -1
      ) {
        categories.push(categoryToDB);
      }
      console.log('categoria:', category.name, categoryToDB.url);
    }
    console.log('tamaño: ', categories.length);
    // console.log('insertare: ', categories);
    await EcommercesCategory.insertMany(categories);
    console.log('hecho!');
  } catch (error) {
    console.log('error->', error);
  }
})();

function getUrl(text) {
  let regex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  let result = text.match(regex);
  return result[result.length - 1];
}
