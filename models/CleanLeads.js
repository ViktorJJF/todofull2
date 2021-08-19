const mongoose = require('mongoose');

const { Schema } = mongoose;
const {
  formatPhone,
  getCleanLead,
  sendWhatsappMessage,
  updateCleanLead,
} = require('../helpers/utils2.js');

let whatsappMessages = require('../classes/WhatsappMessages');
const config = require('../config');
const axios = require('axios');

const sourceSchema = new Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['CHATBOT', 'PAGINA'],
        message: '{VALUE} no es un estado válido',
      },
      default: 'CHATBOT',
    },
    contactId: String,
    fuente: {
      type: String,
      required: true,
      // unique: true,
    },
    appName: String,
    msnActivaDefault: String,
    nombre: {
      type: String,
    },
    email: String,
    ciudad: String,
    asunto: String,
    resultado: String,
    nota: String,
    labels: [
      new Schema(
        {
          labelId: {
            type: Schema.Types.ObjectId,
            ref: 'FacebookLabels',
          },
        },
        {
          versionKey: false,
          timestamps: true,
        },
      ),
    ],
    pais: {
      type: String,
      enum: {
        values: ['PERU', 'Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país de MUJERON válido',
      },
      default: 'Peru',
    },
  },
  { timestamps: true },
);

const cleanLeadsSchema = new Schema(
  {
    details: [sourceSchema],
    telefono: {
      type: String,
      unique: true,
      required: true,
    },
    estado: {
      type: String,
      enum: {
        values: [
          'SIN ASIGNAR',
          'SIN CONTACTAR',
          'CONTACTADO',
          'RE-CONECTAR',
          'INFORMADO AL AGENTE',
          // otros
          'SIN WHATSAPP',
          'NUMERO ERRADO',
          'COMPRA REALIZADA',
          'COMPRA FALLIDA',
        ],
        message: '{VALUE} no es un estado válido',
      },
      set: function (estado) {
        this._previousEstado = this.estado;
        return estado;
      },
    },
    logEstado: [
      new Schema(
        {
          estado: String,
          fuente: String,
        },
        { timestamps: true },
      ),
    ],
    status: {
      type: Boolean,
      default: true,
    },
    telefonoId: {
      type: Schema.Types.ObjectId,
      ref: 'Telefonos',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// formato de numero telefonico
cleanLeadsSchema.pre('save', function (next) {
  // console.log('vino este formato: ', this.telefono, this);
  this.telefono = formatPhone(
    this.telefono,
    this.details.length > 0 ? this.details[0].pais : '',
  );
  if (
    this.sendWhatsapp &&
    !whatsappMessages.getSentMessageToAgent(
      this._id,
      this.sendWhatsappSource || 'BOT',
    )
  ) {
    // cambiando estado en clase mensajes enviados
    whatsappMessages.setSentMessageToAgent(
      this._id,
      this.sendWhatsappSource || 'BOT',
    );
    checkEstado(this);
  }
  // agregando estado al log *Fuente es una variable adicional agregada al guardar modelo
  if (this.logEstado) {
    this.logEstado.push({ estado: this.estado, fuente: this.fuente });
  } else {
    this.logEstado = [{ estado: this.estado, fuente: this.fuente }];
  }
  next();
});

async function checkEstado(cleanLead) {
  if (
    cleanLead.estado === 'RE-CONECTAR' ||
    cleanLead.estado === 'COMPRA FALLIDA'
  ) {
    if (cleanLead.telefonoId) {
      let cleanLeadApi = await getCleanLead(cleanLead._id);
      if (cleanLeadApi) {
        cleanLeadApi.details = cleanLeadApi.details.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );
        let detailsBySource = cleanLeadApi.details[0];
        let labels = detailsBySource.labels
          .filter((el) => el.labelId)
          .reduce((unique, o) => {
            if (!unique.some((obj) => obj.labelId.name === o.labelId.name)) {
              unique.push(o);
            }
            return unique;
          }, []); // para prevenir duplicados
        let { nota } = detailsBySource;
        if (nota && nota.length > 0) {
          if (labels.length > 0) {
            nota += `\n*Etiquetas: ${labels
              .map((el) => el.labelId.name)
              .join(', ')}`;
          }

          try {
            let status = await sendWhatsappMessage(
              cleanLead.telefonoId.numero.replace(/ /g, ''),
              nota,
            );
            if (status) {
              // cambiando estado
              updateCleanLead(cleanLead._id, { estado: 'INFORMADO AL AGENTE' });
            }
          } catch (error) {
            console.log('hubo un error enviando mensaje Whatsapp');
          }
        }
      }
    }
    // agregando
  }
}

// auto populate
let autoPopulateLead = function (next) {
  this.populate('telefonoId');
  next();
};

let autoPopulateLead2 = function (next) {
  this.populate('details.labels.labelId');
  next();
};

cleanLeadsSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
cleanLeadsSchema
  .pre('findOne', autoPopulateLead2)
  .pre('find', autoPopulateLead2);

mongoose.model('CleanLeads', cleanLeadsSchema).syncIndexes();

module.exports = mongoose.model('CleanLeads', cleanLeadsSchema);
