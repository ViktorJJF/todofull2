const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const User = require('../models/Users');
const { itemAlreadyExists } = require('./utils');

/**
 * Sends email
 * @param {Object} data - data
 * @param {boolean} callback - callback
 */
const sendEmail = async (data, callback) => {
  const auth = {
    auth: {
      // eslint-disable-next-line camelcase
      api_key: process.env.EMAIL_SMTP_API_MAILGUN,
      domain: process.env.EMAIL_SMTP_DOMAIN_MAILGUN,
    },
  };
  const transporter = nodemailer.createTransport(mg(auth));
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `${data.user.name} <${data.user.email}>`,
    subject: data.subject,
    html: data.htmlMessage,
  };
  if (process.env.EMAIL_SMTP_API_MAILGUN) {
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return callback(false);
      }
      return callback(true);
    });
  }
};

/**
 * Prepares to send email
 * @param {string} user - user object
 * @param {string} subject - subject
 * @param {string} htmlMessage - html message
 */
const prepareToSendEmail = (user, subject, htmlMessage) => {
  user = {
    name: user.name,
    email: user.email,
    verification: user.verification,
  };
  const data = {
    user,
    subject,
    htmlMessage,
  };
  if (process.env.NODE_ENV === 'production') {
    sendEmail(data, (messageSent) => {
      if (messageSent) {
        console.log(`Email SENT to: ${user.email}`);
      } else {
        console.log(`Email FAILED to: ${user.email}`);
      }
      return true;
    });
  } else if (process.env.NODE_ENV === 'development') {
    console.log(data);
  }
};

module.exports = {
  /**
   * Checks User model if user with an specific email exists
   * @param {string} email - user email
   */
  async emailExists(email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'EMAIL_ALREADY_EXISTS');
          resolve(false);
        },
      );
    });
  },

  /**
   * Checks User model if user with an specific email exists but excluding user id
   * @param {string} id - user id
   * @param {string} email - user email
   */
  async emailExistsExcludingMyself(id, email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
          _id: {
            $ne: id,
          },
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'EMAIL_ALREADY_EXISTS');
          resolve(false);
        },
      );
    });
  },

  /**
   * Sends registration email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendRegistrationEmailMessage(user) {
    const subject = 'Verificar tu Email en el Sistema';
    const htmlMessage = `<p>Hola ${user.first_name} ${user.last_name}.</p> <p>¡Bienvenido! Para verificar tu Email, por favor haz click en este enlace:</p> <p>${process.env.FRONTEND_URL}/verify/${user.verification}</p> <p>Gracias.</p>`;
    prepareToSendEmail(user, subject, htmlMessage);
  },

  /**
   * Sends reset password email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendResetPasswordEmailMessage(locale = 'es', user) {
    console.log(locale);
    const subject = 'Olvidaste tu contraseña...';
    // const htmlMessage = i18n.__(
    //   "forgotPassword.MESSAGE",
    //   user.email,
    //   process.env.FRONTEND_URL,
    //   user.verification
    // );
    const htmlMessage = 'olvidaste la contraseña';
    prepareToSendEmail(user, subject, htmlMessage);
  },
};
