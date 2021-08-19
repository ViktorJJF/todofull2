const mongoose = require('mongoose');

const { Schema } = mongoose;

const ecommercesContacts = new Schema(
  {
    idContact: {
      type: Number,
    },
    first_name: String,
    last_name: String,
    phone: String,
    email: String,
    date_modified: Date,
    date_created: Date,
    city: String,
    state: String,
    mailchimp: {
      id: Number,
      status: String,
    },
    country: {
      type: String,
      enum: {
        values: ['Peru', 'Chile', 'Colombia'],
        message: '{VALUE} no es un país de Ecommerce válido',
      },
      default: 'Peru',
    },
    url: String,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

//formato de numero telefonico
ecommercesContacts.pre('save', function (next) {
  this.phone = this.phone.replace(/\s+/g, '').replace('+', '');
  next();
});

ecommercesContacts.index({ idContact: 1, email: 1, url: 1 }, { unique: true });

mongoose.model('EcommercesContacts', ecommercesContacts).syncIndexes();

module.exports = mongoose.model('EcommercesContacts', ecommercesContacts);
