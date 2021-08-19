require('dotenv-safe').config();
let mongoose = require('mongoose');
const initMongo = require('./config/mongo');
initMongo();
const Ecommerce = require('./models/Ecommerces');
const Category = require('./models/EcommercesCategories');

(async () => {
  let categories=await Category.find();
  console.log("las categoriass: ",categories.length);
  let products=await Ecommerce.find();
  for (const product of products) {
    for (const category of product.categories) {
        let categoryDB=categories.find(el=>el.idCategory==category.id && el.country==product.country)
        category['_id']=mongoose.Types.ObjectId(categoryDB._id);
    }
    await product.save();
    console.log("producto guardado...");
  }
  console.log("hecho!!!");
})();
