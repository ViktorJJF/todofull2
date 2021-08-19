require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const extractDomain = require('extract-domain');
const EcommercesOrders = require('./models/EcommercesOrders');
const EcommercesContact = require('./models/EcommercesContacts');
const Woocommerce = require('./models/Woocommerces');
const axios = require('axios');

//Eliminar los que no tengan nombres telefono ciudad
(async () => {
  let ecommercesOrders = await EcommercesOrders.find({
    ecommercesContactId: null,
  });
  // console.log('los contactos:', contacts);
  for (const ecommercesOrder of ecommercesOrders) {
    try {
      if (
        !ecommercesOrder.ecommercesContactId &&
        ecommercesOrder.customer_id != 0
      ) {
        ecommercesOrder.ecommercesContactId = await getContactIdFromTodofull(
          ecommercesOrder.customer_id,
          ecommercesOrder.url,
        );
        ecommercesOrder.save();
        console.log('HECHO!!');
      }
    } catch (error) {
      console.log('el error: ', error);
    }
  }
  console.log('fin....');
})();

async function getContactIdFromTodofull(customerId, sourceUrl) {
  console.log('recibido: ', customerId, sourceUrl);
  let contact = await EcommercesContact.findOne({
    idContact: customerId,
    url: sourceUrl,
  });
  if (!contact) {
    console.log(
      'el contacto nuevo: ',
      await createUpdateContact(customerId, sourceUrl),
    );
    return await createUpdateContact(customerId, sourceUrl);
  } else {
    return contact._id;
  }
}

async function getContactFromWoocommerce(customerId, sourceUrl) {
  let BASE_URL, USERNAME, PASSWORD, buff, base64data;
  //se obtienen las credenciales para hacer la consulta a woocommerce
  let credential = await getCredential(sourceUrl);
  BASE_URL = getUrl(sourceUrl);
  USERNAME = credential.consumerKey;
  PASSWORD = credential.consumerSecret;
  buff = new Buffer(USERNAME + ':' + PASSWORD);
  base64data = buff.toString('base64');

  let res = await axios({
    method: 'get',
    url: BASE_URL + '/wp-json/wc/v3/customers/' + customerId,
    withCredentials: true,
    headers: {
      Authorization: 'Basic ' + base64data,
    },
  });
  return res.data;
}

async function getCredential(domain) {
  let credentials = await Woocommerce.find();
  return credentials.find(
    (credendial) => extractDomain(credendial.domain) == extractDomain(domain),
  );
}

function getUrl(text) {
  return 'https://' + extractDomain(text);
}

async function createUpdateContact(customerId, sourceUrl) {
  let contactToDB = {};
  let ecommerceContact = await EcommercesContact.findOne({
    idContact: customerId,
    url: getUrl(sourceUrl),
  });
  if (ecommerceContact) {
    //actualizando contacto
    return null;
  } else {
    //nuevo contacto
    let contact = await getContactFromWoocommerce(customerId, sourceUrl);
    contactToDB = {
      idContact: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.billing.phone,
      email: contact.email,
      date_modified: contact.date_modified,
      date_created: contact.date_created,
      city: contact.billing.city,
      state: contact.shipping.state,
      mailchimp: {
        id: contact.metada
          ? contact.metada.find(
              (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
            )
            ? contact.metada.find(
                (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
              ).id
            : ''
          : '',
        status: contact.metada
          ? contact.metada.find(
              (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
            )
            ? contact.metada.find(
                (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
              ).value
            : ''
          : '',
      },
      country: getCountryFromUrl(sourceUrl),
      url: getUrl(sourceUrl),
    };
    return await new EcommercesContact(contactToDB).save()._id;
    // return new EcommercesContact(contactToDB);
  }
}

function getCountryFromUrl(url) {
  if (url.includes('.cl')) {
    return 'Chile';
  } else if (url.includes('.pe')) {
    return 'Peru';
  } else {
    return 'Colombia';
  }
}
