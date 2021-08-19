const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
const auth = {
  auth: {
    api_key: 'd95800d6601f7c00881a11b45a677d00-a65173b1-79344ae9',
    domain: 'sandboxed7019670ac24489a49ee1a41d26bda1.mailgun.org',
  },
};

const nodemailerMailgun = nodemailer.createTransport(mg(auth));
console.log('gaea');
nodemailerMailgun.sendMail(
  {
    from: 'support@iskays.com',
    to: 'vj.jimenez96@gmail.com', // An array if you have multiple recipients.
    subject: 'Hola que hace!',
    // You can use "html:" to send HTML email content. It's magic!
    html: '<b>Wow Big powerful letters</b><br/>Brus!',
  },
  (err, info) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      console.log(`Response: ${info}`);
    }
  },
);
