require('dotenv-safe').config();
let mongoose = require('mongoose');
const initMongo = require('./config/mongo');
initMongo();
const CommentsFacebook = require('./models/CommentsFacebook');

(async () => {
  await CommentsFacebook.updateMany({}, { selectedCategories: [] });
  console.log('hecho!');
})();
