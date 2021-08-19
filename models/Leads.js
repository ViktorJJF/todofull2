const mongoose = require('mongoose');

const { Schema } = mongoose;

const leadsSchema = new Schema(
  {
    contactId: { type: String },
    fuente: {
      type: String,
      // required: true,
    },
    sourceName: String,
    nombre: {
      type: String,
    },
    telefono: {
      type: String,
    },
    email: String,
    ciudad: String,
    asunto: String,
    estado: {
      type: String,
      enum: {
        values: [
          'SIN ASIGNAR',
          'SIN CONTACTAR',
          'CONTACTADO',
          'RE-CONECTAR',
          'INFORMADO AL AGENTE',
          //otros
          'SIN WHATSAPP',
          'NUMERO ERRADO',
        ],
        message: '{VALUE} no es un estado válido',
      },
    },
    resultado: String,
    nota: String,
    status: {
      type: Boolean,
      default: true,
    },
    pais: {
      type: String,
      enum: {
        values: ['PERU', 'Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país de MUJERON válido',
      },
      default: 'Peru',
    },
    telefonoId: {
      type: Schema.Types.ObjectId,
      ref: 'Telefonos',
    },
    msnActivaDefault: String,
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

//auto populate
var autoPopulateLead = function (next) {
  this.populate('telefonoId');
  next();
};

var autoPopulateLead2 = function (next) {
  this.populate('labels.labelId');
  next();
};

leadsSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
leadsSchema.pre('findOne', autoPopulateLead2).pre('find', autoPopulateLead2);

// mongoose.model('Leads', leadsSchema).syncIndexes();

module.exports = mongoose.model('Leads', leadsSchema);
