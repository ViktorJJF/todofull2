/**
 * Este cronjob manda un mensaje de Whatsapp diario
 */

const schedule = require('node-schedule');
const { subDays, format, startOfDay, endOfDay } = require('date-fns');
const { es } = require('date-fns/locale');
const Counts = require('../models/Counts');
const { sendWhatsappMessage } = require('../helpers/utils2');

function start() {
  let rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [0, new schedule.Range(0, 6)];
  rule.hour = 8;
  rule.minute = 1;
  // rule.second = 30;
  schedule.scheduleJob(rule, async () => {
    console.log('enviando whatsap...');
    sendWhatsappLeadsSinAsignar();
  });
}

async function sendWhatsappLeadsSinAsignar() {
  try {
    let dateYesterday = format(
      subDays(new Date(), 1),
      "d 'de' MMMM 'del' yyyy",
      {
        locale: es,
      },
    );
    let doc = await Counts.findOne({
      createdAt: {
        $gte: startOfDay(subDays(new Date(), 1)),
        $lt: startOfDay(new Date()),
      },
    });
    if (doc) {
      // enviando mensaje
      let message = `El día de ayer (${dateYesterday}), hubieron *${Object.keys(
        doc.leadSinAsignarCount,
      ).reduce((acc, el) => {
        acc += doc.leadSinAsignarCount[el];
        return acc;
      }, 0)}* contactos *sin asignar* y *${Object.keys(
        doc.leadReconectarCount,
      ).reduce((acc, el) => {
        acc += doc.leadReconectarCount[el];
        return acc;
      }, 0)}* contactos en *RE-CONECTAR*`;
      message += '\n\n*Detalle*';
      if (doc['leadReconectarCount']) {
        message += `\nRE-CONECTAR CHILE :${
          doc['leadReconectarCount']['Chile'] || '0'
        }`;
        message += `\nRE-CONECTAR PERU :${
          doc['leadReconectarCount']['Peru'] || '0'
        }`;
        message += `\nRE-CONECTAR COLOMBIA :${
          doc['leadReconectarCount']['Colombia'] || '0'
        }`;
      }
      message += `\n*********************************`;
      if (doc['leadSinAsignarCount']) {
        message += `\nSIN ASIGNAR CHILE :${
          doc['leadSinAsignarCount']['Chile'] || '0'
        }`;
        message += `\nSIN ASIGNAR PERU :${
          doc['leadSinAsignarCount']['Peru'] || '0'
        }`;
        message += `\nSIN ASIGNAR COLOMBIA :${
          doc['leadSinAsignarCount']['Colombia'] || '0'
        }`;
      }

      await sendWhatsappMessage('56950056342', message);
    }
  } catch (error) {
    console.log(error);
  }
}

start();
