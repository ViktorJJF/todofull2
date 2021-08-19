require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const Contactos = require('./models/Contactos');
const CleanLeads = require('./models/CleanLeads');
(async () => {
  let cleanLeads = await CleanLeads.find({
    'details.fuente': '6000d2313de4765e8c29543c',
  }).sort({
    createdAt: 1,
  });
  console.log(
    'los limpios: ',
    cleanLeads.filter((el) => el.details.length > 1),
  );
  // for (const cleanLead of cleanLeads) {
  //   if (!cleanLead.hecho) {
  //     let repetidos = cleanLeads.filter(
  //       (el) => el.telefono == cleanLead.telefono,
  //     );
  //     if (repetidos.length > 1) {
  //       let cleanLead = repetidos[0];

  //       for (let i = 0; i < repetidos.length; i++) {
  //         repetidos[i].hecho = true;
  //         if (i != 0) {
  //           if (
  //             !cleanLead.details.find(
  //               (detail) => detail.fuente == repetidos[i].details[0].fuente,
  //             )
  //           ) {
  //             cleanLead.details.push({
  //               ciudad: repetidos[i].details[0].ciudad,
  //               email: repetidos[i].details[0].email,
  //               fuente: repetidos[i].details[0].fuente,
  //               labels: repetidos[i].details[0].labels,
  //               msnActivaDefault: repetidos[i].details[0].msnActivaDefault,
  //               nombre: repetidos[i].details[0].nombre,
  //               pais: repetidos[i].details[0].pais,
  //               type: repetidos[i].details[0].type,
  //               _id: repetidos[i].details[0]._id,
  //             });
  //           }
  //           await repetidos[i].remove();
  //           console.log('removido...');
  //         }
  //       }
  //       await cleanLead.save();
  //       console.log('guardado!');
  //       console.log('este numero se repite!!', cleanLead.telefono);
  //     }
  //   }
  // }
  console.log('hecho!! FIN');
})();
