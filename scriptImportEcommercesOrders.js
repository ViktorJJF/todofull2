require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const axios = require('axios');
const EcommercesOrder = require('./models/EcommercesOrders');
const EcommercesContact = require('./models/EcommercesContacts');
const fs = require('fs');

let COUNTRY = 'Chile';
let BASE_URL = 'https://fajassalome.cl';
const USERNAME = 'ck_d246cbc455574055ffeeadf05d15965cac2c841a';
const PASSWORD = 'cs_4d9b1ec222a5382a1c1343eefc5a05290c9db0e7';
let buff = new Buffer(USERNAME + ':' + PASSWORD);
let base64data = buff.toString('base64');

(async () => {
  let currentPage = 1;
  let isDone = false;
  try {
    while (!isDone) {
      let orders = [];
      let res = await axios({
        method: 'get',
        url:
          BASE_URL + `/wp-json/wc/v3/orders?page=${currentPage}&per_page=100`,
        withCredentials: true,
        headers: {
          Authorization: 'Basic ' + base64data,
        },
      });
      //emparejando datos
      for (const order of res.data) {
        let orderToDB = {
          idOrder: order.id,
          parent_id: order.parent_id,
          status: order.status,
          currency: order.currency,
          date_created: order.date_created,
          date_modified: order.date_modified,
          discount_total: order.discount_total,
          shipping_total: order.shipping_total,
          customer_id: order.customer_id,
          ecommercesContactId: null,
          order_key: order.order_key,
          payment_method: order.payment_methods,
          customer_ip_address: order.customer_ip_address,
          customer_user_agent: order.customer_user_agent,
          rut: order.metada
            ? order.metada.find((el) => el.key == 'rut')
              ? order.metada.find((el) => el.key == 'rut').value
              : ''
            : '',
          mailchimp: {
            id: order.metada
              ? order.metada.find(
                  (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                )
                ? order.metada.find(
                    (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                  ).id
                : ''
              : '',
            status: order.metada
              ? order.metada.find(
                  (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                )
                ? order.metada.find(
                    (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
                  ).value
                : ''
              : '',
          },
          payment: {
            key: order.metada
              ? order.metada.find((el) => el.key == 'paymentCodeResult')
                ? order.metada.find((el) => el.key == 'paymentCodeResult').id
                : ''
              : '',
            value: order.metada
              ? order.metada.find((el) => el.key == 'paymentCodeResult')
                ? order.metada.find((el) => el.key == 'paymentCodeResult').value
                : ''
              : '',
          },
          line_items: order.line_items
            ? order.line_items.map((el) => ({
                idEcommerce: el.id,
                ecommerceId: null,
                variation_id: el.variation_id,
                quantity: el.quantity,
                total: el.total,
                meta_data: el.meta_data.map((metadata) => ({
                  id: metadata.id,
                  key: metadata.key,
                  value: JSON.stringify(metadata.value),
                  display_key: metadata.display_key,
                  display_value: JSON.stringify(metadata.display_value),
                })),
              }))
            : [],
          country: COUNTRY,
          url: BASE_URL,
        };
        if (orderToDB.customer_id == 0) {
          let {
            first_name,
            last_name,
            city,
            phone,
            email,
            state,
          } = order.billing;
          //asignando id de mongo al contacto
          orderToDB.ecommercesContactId = await createContact(
            first_name,
            last_name,
            phone,
            email,
            city,
            state,
          );
        } else {
          orderToDB.ecommercesContactId = await getContactIdFromTodofull(
            orderToDB.customer_id,
          );
        }
        orders.push(orderToDB);
      }
      // console.log('para pushear: ', JSON.stringify(orders, null, ' '));
      console.log('tamaño: ', orders.length);
      // console.log('los orders: ', JSON.stringify(orders, null, ' '));
      // fs.writeFileSync('salida.json', JSON.stringify(orders));
      await EcommercesOrder.insertMany(orders);
      console.log('hecho!');
      //el resto
      console.log(`Página ${currentPage} importada....`);
      currentPage += 1;
      if (res.data.length == 0) isDone = true;
    }
    console.log('fin!!');
  } catch (error) {
    console.log('error->', error);
  }
})();

async function createContact(first_name, last_name, phone, email, city, state) {
  let contact = await EcommercesContact.findOne({ email, url: BASE_URL });
  let contactDB = new EcommercesContact();
  if (!contact) {
    console.log('creando Contacto con correo: ', email);
    //crear contacto
    contactDB.date_created = new Date();
    contactDB.date_modified = new Date();
    contactDB.idContact = 0;
    contactDB.first_name = first_name;
    contactDB.last_name = last_name;
    contactDB.phone = phone;
    contactDB.email = email;
    contactDB.city = city;
    contactDB.state = state;
    contactDB.country = COUNTRY;
    contactDB.url = BASE_URL;
    // console.log('el nuevo contacto: ', contactDB);
    await contactDB.save();
  }
  return contact ? contact._id : contactDB._id;
}

async function getContactIdFromTodofull(customerId) {
  let contact = await EcommercesContact.findOne({
    idContact: customerId,
    url: BASE_URL,
  });
  return contact ? contact._id : null;
}
