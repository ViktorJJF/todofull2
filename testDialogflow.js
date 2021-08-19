const dialogflow = require('dialogflow');
const uuid = require('uuid');
const fs = require('fs');

require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const Ecommerce = require('./models/Ecommerces');

let credentialsPath = __dirname + '/controllers/dialogflow/';
fs.readdirSync('./controllers/dialogflow').forEach((file) => {
  if (file.includes('Peru')) credentialsPath = credentialsPath + file;
});

const projectId = 'newagent-fbdwju';
//client entities
const entitiesClient = new dialogflow.EntityTypesClient({
  projectId,
  keyFilename: credentialsPath,
});
const formattedParent = entitiesClient.projectAgentPath(projectId);

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */

const listEntities = async () => {
  const entitiesClient = new dialogflow.EntityTypesClient({
    projectId: 'newagent-fbdwju',
    keyFilename: credentialsPath,
  });

  entitiesClient
    .listEntityTypes({ parent: formattedParent })
    .then((responses) => {
      const resources = responses[0];
      for (const resource of resources) {
        console.log('el resource: ', resource);
        // doThingsWith(resource)
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

function getEntity(entityId) {
  return new Promise((resolve, reject) => {
    const formattedName = entitiesClient.entityTypePath(projectId, entityId);
    entitiesClient
      .getEntityType({ name: formattedName })
      .then((responses) => {
        const response = responses[0];
        resolve(response);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

function updateEntityValue(entityId, value, newValue) {
  return new Promise(async (resolve, reject) => {
    //valores
    let entity = {};
    let body = await getEntity(entityId);
    let ecommerces = await Ecommerce.find({ country: 'Peru' });
    let entities = ecommerces.map((el) => ({
      synonyms: [el.ref],
      value: el.ref,
    }));
    entitiesClient
      .updateEntityType({
        entityType: {
          entities,
          name:
            'projects/newagent-fbdwju/agent/entityTypes/d3de5f01-0c5a-4ec3-9471-2d6ab7c98da9',
          displayName: 'Ref-woocommerce',
          kind: 'KIND_LIST',
          autoExpansionMode: 'AUTO_EXPANSION_MODE_UNSPECIFIED',
          enableFuzzyExtraction: true,
        },
      })
      .then((responses) => {
        resolve();
      })
      .catch((err) => {
        console.error(err);
      });
  });
}

(async () => {
  await updateEntityValue(
    'd3de5f01-0c5a-4ec3-9471-2d6ab7c98da9',
    'BLUSA CAIRO x5',
    'BLUSCA CAIRO X42',
  );
  console.log(
    'actualizado: ',
    await getEntity('d3de5f01-0c5a-4ec3-9471-2d6ab7c98da9'),
  );
})();
// listEntities();

// module.exports = {
//   listEntities,

// };
