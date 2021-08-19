require('dotenv-safe').config();
const mongoose = require('mongoose');
const fs = require('fs');
const initMongo = require('../config/mongo');

initMongo();

const CLEANFIRST = true;

async function seedCollection(model, data = [], cleanBefore = true) {
  // delete collection
  let result = [];
  const { collectionName } = model.collection;
  if (CLEANFIRST && cleanBefore) {
    try {
      await mongoose.connection.dropCollection(collectionName);
      console.log('se eliminó: ', collectionName);
    } catch {
      console.log(`el modelo ${collectionName} ya había sido eliminado`);
    }
  }
  // seed collection
  try {
    result = await model.insertMany(data);
    console.log(`Seed terminado en ${collectionName}`);
    return result;
  } catch (error) {
    console.log(`algo salio mal con el seed en ${collectionName}...`, error);
  }
  return true;
}

function formatFileName(file) {
  const indexes = [];
  for (let i = 0; i < file.length; i++) {
    if (file[i] === '.') indexes.push(i);
  }
  const model = file.substring(indexes[0] + 1, indexes[1]);
  return model;
}

async function beginSeed() {
  console.log('empezando seeder...');
  const files = fs.readdirSync('./seeder');
  for (const file of files) {
    console.log('El file: ', file);
    if (file.includes('.seeder')) {
      const modelName = formatFileName(file);
      const model = require(`../server/models/${modelName}`);
      const data = require(`./${file}`);
      await seedCollection(model, await data);
    }
  }
  console.log('SEEDING TERMINADO...');
}

beginSeed();
