const extractDomain = require('extract-domain');
const express = require('express');

const axios = require('axios');
const router = express.Router();
const Lead = require('../models/Leads');
const Contacto = require('../models/Contactos');
const Woocommerce = require('../models/Woocommerces');
const CleanLead = require('../models/CleanLeads');
const Telefono = require('../models/Telefonos');
const Agente = require('../models/Agentes');
const Woocomerce = require('../models/Woocommerces');
const { checkQueryString, getItems2 } = require('../helpers/db');
const {
  searchCleanLead,
  getCountryFromDomain,
  random,
  searchLabel,
  setTodofullLabel,
} = require('../helpers/utils');

const {
  getSourceById,
  increaseCount,
  colocarEtiquetaFB,
} = require('../helpers/utils2');
const config = require('../config');

const lastMessages = new Map();
const leads = [];

router.get('/', (req, res) => {
  res.send('Hello World');
});

/**
 * @description Support board va a hacer muchas solicitudes a este endpoint, pero se pueden discernir con propiedad function
 */
router.post('/webhook', express.json(), async (req, res) => {
  // console.log('headers: ', JSON.stringify(req.headers, null, ' '));
  console.log('el req body: ', JSON.stringify(req.body, null, ' '));
  if (req.body.function == 'bot-message') {
    let { queryResult } = req.body.data.response.response;
    let senderId = queryResult.outputContexts[0].name
      .substring(
        queryResult.outputContexts[0].name.indexOf('sessions'),
        queryResult.outputContexts[0].name.length,
      )
      .match(/\d+/)[0];
    let sourceUrl = req.body['sender-url']; // el dominio de woocommerce
    console.log('el senderId: ', senderId);
    // verificando si hay que agregar alguna etiqueta
    const responsesWithLabels = queryResult.fulfillmentMessages.filter(
      (el) => el.payload && el.payload.etiquetaFB,
    );
    console.log('🚀 Aqui *** -> responsesWithLabels', responsesWithLabels);
    // agregando etiquetas (si hubiera)
    responsesWithLabels.map((el) =>
      colocarEtiquetaFB(senderId, el.payload.etiquetaFB),
    );
    // verificando si se trata del flujo captura leads
    if (queryResult.intent.displayName === 'Default Fallback Intent') {
      lastMessages.set(senderId, queryResult.queryText);
    }
    // verificando si agregar etiqueta talla
    if (queryResult.action == 'TallaXRefX->woo') {
      let talla = queryResult.parameters.Talla;
      // agregando etiqueta
      if (talla) {
        let etiqueta = await searchLabel(
          talla,
          getCountryFromDomain(sourceUrl),
        );
        if (etiqueta) setTodofullLabel(senderId, etiqueta.idLabel);
      }
    }
    if (queryResult.action == 'NumerosTelefonicosRecibidos.action') {
      // creando lead
      let { nombre } = queryResult.parameters;
      let telefono =
        queryResult.parameters.telefono.length > 0
          ? queryResult.parameters.telefono[0]
          : null;
      let { correo } = queryResult.parameters;
      let { ciudad } = queryResult.parameters;
      // el resto
      let woocommerceId = await getWoocommerceId(sourceUrl);
      if (telefono && !nombre && !correo && !ciudad) {
        createTemporalLead(senderId, null, telefono, null, null);
        // buscando lead en tabla cleanLead
        leadDB = await searchCleanLead(telefono);
        if (leadDB) {
          console.log('actualizando lead supp board');
          // si existe => actualizando
          // verificando si hay que agregar fuente Woocommerce
          let woocommerceLead = leadDB.details.find(
            (detail) => detail.fuente == woocommerceId,
          );
          if (!woocommerceLead) {
            leadDB.details.push({
              contactId: senderId,
              fuente: woocommerceId,
              msnActivaDefault: lastMessages.get(senderId),
              nombre: '',
              email: '',
              ciudad: '',
              nota: '',
              labels: [],
              pais: getCountryFromDomain(sourceUrl),
            });
          } else {
            // actualizando datos del lead temporal
            updateTemporalLead(
              senderId,
              woocommerceLead.nombre,
              woocommerceLead.email,
              woocommerceLead.ciudad,
            );
            // actualizando pregunta inicial
            woocommerceLead.msnActivaDefault = lastMessages.get(senderId);
          }
          // cambiar el estado a re-conectar
          if (leadDB.estado && leadDB.estado != 'SIN ASIGNAR') {
            leadDB.estado = 'RE-CONECTAR';
            leadDB.sendWhatsapp = true;
          }
          leadDB.fuente = woocommerceId; // para log
          leadDB.save();
        } else {
          console.log('creando lead supp board');
          // creando nuevo lead con primera fuente (source) Facebook
          let agentId = await assignAgent(telefono);
          leadDB = await new CleanLead({
            details: [
              {
                contactId: senderId,
                fuente: woocommerceId,
                msnActivaDefault: lastMessages.get(senderId),
                nombre: '',
                email: '',
                ciudad: '',
                nota: '',
                labels: [],
                pais: getCountryFromDomain(sourceUrl),
              },
            ],
            estado: agentId ? 'RE-CONECTAR' : 'SIN ASIGNAR',
            telefono,
            telefonoId: agentId || null, // asignando agente
            sendWhatsapp: true, // para evitar mensaje repetido
            fuente: woocommerceId,
          }).save();
          if (!agentId) {
            // se aumenta el conteo de contacto sin asignar
            increaseCount(
              'leadSinAsignarCount',
              getCountryFromDomain(sourceUrl),
            );
          } else {
            // increamenta conteo reconectar
            increaseCount(
              'leadReconectarCount',
              getCountryFromDomain(sourceUrl),
            );
          }
        }

        // if (getTemporalLead(senderId).nombre)
        //   return sendToDialogFlow(
        //     senderId,
        //     getTemporalLead(senderId).nombre,
        //     pageID,
        //   );
      }
      if (nombre && !correo && !ciudad) {
        if (!getTemporalLead(senderId).nombre) {
          await updateCleanLead(woocommerceId, telefono, 'nombre', nombre);
        }

        let leadToUpdate = await searchCleanLead(telefono);
        if (leadToUpdate) {
          // buscando agente
          if (leadToUpdate.telefonoId) {
            // ya tiene asignado un agente
            // generando nota para el agente
            let detailToUpdate = leadToUpdate.details.find(
              (detail) => detail.fuente == woocommerceId,
            );
            if (detailToUpdate) {
              detailToUpdate.nota = `Hola ${
                leadToUpdate.telefonoId.agenteId.nombre
              } tu cliente: *${nombre}*\ncon telefono : *${telefono}*\nconsulta:'${
                lastMessages.get(senderId) ? lastMessages.get(senderId) : ' '
              }'.\nen la página: ${
                (await getSourceById(detailToUpdate.fuente)).name
              } \n\nEn cuanto la contactes me informas para borrarla de los pendientes`;
            }
          }
          // rellenando el resto de campos
          leadToUpdate.nombre = nombre;
          // guardando cambios
          leadToUpdate.sendWhatsapp = true;
          await leadToUpdate.save();
        }

        // if (getTemporalLead(senderId).correo)
        //   return sendToDialogFlow(
        //     senderId,
        //     getTemporalLead(senderId).correo,
        //     pageID,
        //   );
      }
      if (correo && !ciudad) {
        if (!getTemporalLead(senderId).correo) {
          await updateCleanLead(woocommerceId, telefono, 'email', correo);
        }
        // if (getTemporalLead(senderId).ciudad)
        //   return sendToDialogFlow(
        //     senderId,
        //     getTemporalLead(senderId).ciudad,
        //     pageID
        //   );
      }
      if (ciudad) {
        if (!getTemporalLead(senderId).ciudad) {
          await updateCleanLead(woocommerceId, telefono, 'ciudad', ciudad);
        }
        // eliminando temporal (de memoria, no de bd)
        deleteTemporalLead(telefono);
      }
    }
    // queryResult
  }
  res.sendStatus(200);
});

function createTemporalLead(senderId, nombre, telefono, correo, ciudad) {
  // se usa como campo unico el senderId
  let lead = leads.find((lead) => lead.senderId == senderId);
  if (!lead) {
    leads.push({
      senderId,
      nombre,
      telefono,
      correo,
      ciudad,
    });
  }
}

function getTemporalLead(senderId) {
  let lead = leads.find((lead) => lead.senderId == senderId);
  if (!lead) createTemporalLead(senderId);
  lead = leads.find((lead) => lead.senderId == senderId);
  return lead;
}

function updateTemporalLead(senderId, nombre, correo, ciudad) {
  let leadIndex = leads.findIndex((lead) => lead.senderId == senderId);
  leads[leadIndex].nombre = nombre;
  leads[leadIndex].correo = correo;
  leads[leadIndex].ciudad = ciudad;
}

function deleteTemporalLead(telefono) {
  let leadIndex = leads.findIndex((lead) => lead.telefono == telefono);
  leads.splice(leadIndex, 1);
}

async function getWoocommerceId(domain) {
  let woocommerces = await Woocomerce.find();
  return woocommerces.find(
    (fanpage) => extractDomain(fanpage.domain) == extractDomain(domain),
  )._id;
}

/**
 *
 * @param {*} params
 * @returns retorna el _id de la tabla Telefonos (telefonos Google Contact)
 */
async function assignAgent(telefono) {
  let telefonoId;
  // buscando si el telefono del lead está asignado a algun agentee
  let woocommerces = await Woocommerce.find(); // paginas woocommerce
  let query = await checkQueryString({
    filter: telefono,
    fields: 'celular',
  });
  let googleContactAgents = await getItems2(Contacto, query);
  if (googleContactAgents.length > 0) {
    // el numero lo tienen varios agentes
    let admin = googleContactAgents.find((el) =>
      woocommerces.find(
        (woocommerce) => woocommerce.telefonoId == el.telefonoId._id,
      ),
    );
    if (admin) {
      // createChatbotLead(admin.telefonoId._id);
      telefonoId = admin.telefonoId._id;
    } else if (googleContactAgents.length == 1) {
      telefonoId = googleContactAgents[0].telefonoId._id;
      // createChatbotLead(googleContactAgents[0].telefonoId._id);
    } else {
      let randomGoogleContactAgent =
        googleContactAgents[random(0, googleContactAgents.length - 1)];
      telefonoId = randomGoogleContactAgent.telefonoId._id;
      // createChatbotLead(randomGoogleContactAgent.telefonoId._id);
    }
  } else {
    // el numero no lo tenia ningun agente
  }
  return telefonoId;
}

async function updateCleanLead(woocommerceId, telefono, parameterName, value) {
  let cleanLead = await searchCleanLead(telefono);
  if (cleanLead) {
    let facebookLead = cleanLead.details.find(
      (el) => el.fuente == woocommerceId,
    );
    if (facebookLead) {
      // lead de facebook encontrado
      facebookLead[parameterName] = value;
      // guardando cambios
      await cleanLead.save();
    }
  } else {
    console.log('lead no encontrado! verificar');
  }
}

module.exports = router;
