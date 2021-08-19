const dialogflow = require('dialogflow');

let entitiesClientInstances = [];

function getConfig(country) {
  let credentialsPath =
    __dirname + process.env['CREDENTIALS_DIALOGFLOW_' + country.toUpperCase()];
  let projectId = require(credentialsPath).project_id;
  //verificando si existe instancia con ese pais
  if (entitiesClientInstances.findIndex((el) => el.country == country) == -1) {
    //no existe y crear
    //client entities
    let entitiesClient = new dialogflow.EntityTypesClient({
      projectId,
      keyFilename: credentialsPath,
    });
    //pusheando instancia de cliente Entity Dialogflow
    entitiesClientInstances.push({ country, entitiesClient });
  }
  let entityInstanceClientIndex = entitiesClientInstances.findIndex(
    (el) => el.country == country,
  );
  //agregar ids de entities Dialogflow si se agregan mas paises
  return {
    projectId,
    client: entitiesClientInstances[entityInstanceClientIndex].entitiesClient,
    entityId:
      country == 'Peru'
        ? 'd3de5f01-0c5a-4ec3-9471-2d6ab7c98da9'
        : country == 'Chile'
        ? '825fabca-668e-42fb-a70d-756b6146ac3c'
        : '',
  };
}

function getEntity(entityId, projectId, entitiesClient) {
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

const updateEntityValue = async (req, res) => {
  let { value, newValue, country } = req.body;
  //valores de configuracion
  let { client, entityId, projectId } = getConfig(country);
  //valores
  let entity = {};
  let body = await getEntity(entityId, projectId, client);
  let valueIndex = body.entities.findIndex((entity) => entity.value == value);
  if (valueIndex > -1) {
    //actualizar valor de entidad
    entity = body.entities[valueIndex]; //entity value encontrado
    entity.value = newValue; //actualizando valor original
    entity.synonyms = [newValue]; //sobreescribiendo sinonimos
  } else {
    //crear valor de entidad
    entity = {
      value: newValue,
      synonyms: [newValue],
    };
    body.entities.push(entity);
  }

  client
    .updateEntityType({ entityType: body })
    .then((responses) => {})
    .catch((err) => {
      return res.status(400).json({ ok: false });
    });
  return res.status(200).json({ ok: true });
};

module.exports = {
  updateEntityValue,
};
