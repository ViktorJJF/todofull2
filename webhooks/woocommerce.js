const extractDomain = require('extract-domain');
const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const Ecommerce = require('../models/Ecommerces');
const EcommercesOrder = require('../models/EcommercesOrders');
const EcommercesCategories = require('../models/EcommercesCategories');
const FacebookLabels = require('../models/FacebookLabels');
const Contacto = require('../models/Contactos');
const EcommercesContact = require('../models/EcommercesContacts');
const Woocommerce = require('../models/Woocommerces');
const CleanLeads = require('../models/CleanLeads');
const Category = require('../models/Categories');
const { searchCleanLead, searchLabel, random } = require('../helpers/utils');
const {
  formatPhone,
  getSourceById,
  increaseCount,
  colocarEtiquetaFB,
} = require('../helpers/utils2');
const { checkQueryString, getItems2 } = require('../helpers/db');

router.post('/webhook', async (req, res) => {
  let { headers } = req;
  let { body } = req;
  let sourceUrl = headers['x-wc-webhook-source']; // url chile peru colombia etc
  console.log('las cabeceras: ', JSON.stringify(req.headers, null, ' '));
  console.log('***************aca empieza***************');
  // console.log('***************aca termina***************');
  console.log('el body: ', JSON.stringify(req.body, null, ' '));
  let product = {};
  // actualizacion de webhook
  if (req.body.webhook_id) return res.sendStatus(200);
  // se trata de evento nuevo pedido / actualizacion pedido
  if (headers['x-wc-webhook-resource'] == 'order') {
    createUpdateOrder(body, sourceUrl);
    return res.sendStatus(200);
  }
  if (Object.keys(req.body).length == 1) {
    // se trata de eliminar un registro
    deleteProduct(req);
  } else {
    // si se trata de alguna variacion, ignorar
    if (body.name.includes(' - ')) return res.sendStatus(200);
    createUpdateProduct(req, body, product, sourceUrl);
  }
  return res.sendStatus(200);
});

// otros metodos

async function createUpdateProduct(req, body, product, sourceUrl) {
  let ecommerce = await Ecommerce.findOne({
    idEcommerce: req.body.id,
    country: getCountryFromUrl(body.permalink),
  });
  if (ecommerce) {
    // actualizar
    ecommerce.name = body.name;
    ecommerce.permalink = body.permalink;
    ecommerce.date_created = body.date_created;
    ecommerce.date_modified = body.date_modified;
    ecommerce.type = body.type;
    ecommerce.status = body.status; // publish
    ecommerce.catalog_visibility = body.catalog_visibility;
    ecommerce.sku = body.sku;
    ecommerce.stock_status = body.stock_status;
    ecommerce.regular_price = body.regular_price;
    ecommerce.sale_price = body.sale_price;
    ecommerce.related_ids = body.related_ids;
    ecommerce.categories = await updateProductCategoriesIds(
      body.categories,
      getCountryFromUrl(sourceUrl),
    );
    ecommerce.related_ids = body.related_ids;
    ecommerce.images = body.images;
    ecommerce.attributes = body.attributes;
    ecommerce.variations = await getVariations(body.id, sourceUrl);
    await ecommerce.save();
    console.log('producto actualizado...');
  } else {
    // crear
    product = {
      idEcommerce: body.id,
      woocommerceId: (await getCredential(sourceUrl))._id,
      name: body.name,
      permalink: body.permalink,
      date_created: body.date_created,
      date_modified: body.date_modified,
      type: body.type,
      stock_status: body.stock_status,
      status: body.status,
      catalog_visibility: body.catalog_visibility,
      sku: body.sku,
      regular_price: body.regular_price,
      sale_price: body.sale_price,
      related_ids: body.related_ids,
      categories: await updateProductCategoriesIds(
        body.categories,
        getCountryFromUrl(sourceUrl),
      ),
      images: body.images,
      attributes: body.attributes,
      url: getUrl(body.permalink),
      country: getCountryFromUrl(body.permalink),
      variations: await getVariations(body.id, sourceUrl),
    };
    await new Ecommerce(product).save();
    console.log('producto nuevo creado...');
  }
  return product;
}

async function createUpdateOrder(body, sourceUrl) {
  let order = {};
  let cleanLeadId = null; // id del lead creado o actualizado en esta orden de pedido
  let ecommerceOrder = await EcommercesOrder.findOne({
    idOrder: body.id,
    url: getUrl(sourceUrl),
  });
  let labels = await getLabelsIdFromOrder(
    body.line_items,
    getCountryFromUrl(sourceUrl),
  );
  console.log('aaaaaaaa labels', labels);
  if (ecommerceOrder) {
    // actualizar
    // asignando id de mongo de tabla ecommerces
    let items = [];
    for (const el of body.line_items) {
      items.push({
        idEcommerce: el.product_id,
        ecommerceId: (
          await getProductById(el.product_id, getCountryFromUrl(sourceUrl))
        )._id,
        variation_id: el.variation_id,
        quantity: el.quantity,
        total: el.total,
        meta_data: el.meta_data,
        parent_name: el.parent_name,
      });
    }
    ecommerceOrder.line_items = items;
    ecommerceOrder.parent_id = body.parent_id;
    ecommerceOrder.status = body.status;
    ecommerceOrder.currency = body.currency;
    ecommerceOrder.date_created = body.date_created;
    ecommerceOrder.date_modified = body.date_modified;
    ecommerceOrder.customer_id = body.customer_id;
    ecommerceOrder.discount_total = body.discount_total;
    ecommerceOrder.shipping_total = body.shipping_total;
    ecommerceOrder.order_key = body.order_key;
    ecommerceOrder.payment_method = body.payment_methods;
    ecommerceOrder.customer_ip_address = body.customer_ip_address;
    ecommerceOrder.customer_user_agent = body.customer_user_agent;
    ecommerceOrder.rut = body.metada
      ? body.metada.find((el) => el.key == 'rut')
        ? body.metada.find((el) => el.key == 'rut').value
        : ''
      : '';

    ecommerceOrder.mailchimp = {
      id: body.metada
        ? body.metada.find(
            (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
          )
          ? body.metada.find(
              (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
            ).id
          : ''
        : '',
      status: body.metada
        ? body.metada.find(
            (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
          )
          ? body.metada.find(
              (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
            ).value
          : ''
        : '',
    };
    ecommerceOrder.payment = {
      key: body.metada
        ? body.metada.find((el) => el.key == 'paymentCodeResult')
          ? body.metada.find((el) => el.key == 'paymentCodeResult').id
          : ''
        : '',
      value: body.metada
        ? body.metada.find((el) => el.key == 'paymentCodeResult')
          ? body.metada.find((el) => el.key == 'paymentCodeResult').value
          : ''
        : '',
    };

    // verificando si crear o actualizar cliente
    if (ecommerceOrder.customer_id != 0) {
      cleanLeadId = await createUpdateContact(
        body.customer_id,
        sourceUrl,
        labels,
      );
    }
    // verificando si el customer id fue 0
    if (ecommerceOrder.customer_id == 0) {
      var { first_name, last_name, city, phone, email, state } = body.billing;
      // asignando id de mongo al contacto
      console.log('desde a');
      cleanLeadId = await createUpdateCleanLead(
        {
          first_name,
          last_name,
          phone,
          email,
          city,
          state,
          country: getCountryFromUrl(sourceUrl),
          url: sourceUrl,
        },
        labels,
      ); // creando cleanLead
      ecommerceOrder.ecommercesContactId = await createContact(
        first_name,
        last_name,
        phone,
        email,
        city,
        state,
        sourceUrl,
      );
    } else {
      // asignando id de mongo para el contacto actualizado y con id generado por Woocommerce
      ecommerceOrder.ecommercesContactId = await getContactIdFromTodofull(
        order.customer_id,
        sourceUrl,
      );
    }
    // REESTRUCTURAR ESTO
    // actualizando estado para orden todofull
    await checkLastOrderState(
      ecommerceOrder.ecommercesContactId,
      ecommerceOrder.status,
      cleanLeadId,
      ecommerceOrder.woocommerceId,
      ecommerceOrder.line_items.reduce((a, b) => a + parseFloat(b.total), 0),
      ecommerceOrder.line_items,
      sourceUrl,
      ecommerceOrder.idOrder,
      ecommerceOrder,
    );
    await ecommerceOrder.save();
    console.log('pedido actualizado... ', ecommerceOrder.idOrder);
  } else {
    // crear
    order = {
      woocommerceId: (await getCredential(sourceUrl))._id,
      idOrder: body.id,
      parent_id: body.parent_id,
      status: body.status,
      currency: body.currency,
      date_created: body.date_created,
      date_modified: body.date_modified,
      discount_total: body.discount_total,
      shipping_total: body.shipping_total,
      customer_id: body.customer_id,
      ecommercesContactId: null,
      order_key: body.order_key,
      payment_method: body.payment_methods,
      customer_ip_address: body.customer_ip_address,
      customer_user_agent: body.customer_user_agent,
      rut: body.metada
        ? body.metada.find((el) => el.key == 'rut')
          ? body.metada.find((el) => el.key == 'rut').value
          : ''
        : '',
      mailchimp: {
        id: body.metada
          ? body.metada.find(
              (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
            )
            ? body.metada.find(
                (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
              ).id
            : ''
          : '',
        status: body.metada
          ? body.metada.find(
              (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
            )
            ? body.metada.find(
                (el) => el.key == 'mailchimp_woocommerce_is_subscribed',
              ).value
            : ''
          : '',
      },
      payment: {
        key: body.metada
          ? body.metada.find((el) => el.key == 'paymentCodeResult')
            ? body.metada.find((el) => el.key == 'paymentCodeResult').id
            : ''
          : '',
        value: body.metada
          ? body.metada.find((el) => el.key == 'paymentCodeResult')
            ? body.metada.find((el) => el.key == 'paymentCodeResult').value
            : ''
          : '',
      },
      line_items: body.line_items
        ? body.line_items.map((el) => ({
            idEcommerce: el.id,
            ecommerceId: null,
            variation_id: el.variation_id,
            quantity: el.quantity,
            total: el.total,
            meta_data: el.meta_data,
            parent_name: el.parent_name,
          }))
        : [],

      country: getCountryFromUrl(sourceUrl),
      url: getUrl(sourceUrl),
    };
    let items = [];
    for (const el of body.line_items) {
      items.push({
        idEcommerce: el.product_id,
        ecommerceId: (
          await getProductById(el.product_id, getCountryFromUrl(sourceUrl))
        )._id,
        variation_id: el.variation_id,
        quantity: el.quantity,
        total: el.total,
        meta_data: el.meta_data,
        parent_name: el.parent_name,
      });
    }
    order.line_items = items;
    if (order.customer_id != 0) {
      cleanLeadId = await createUpdateContact(
        body.customer_id,
        sourceUrl,
        labels,
      );
    }
    // verificando si el customer id fue 0
    if (order.customer_id == 0) {
      var { first_name, last_name, city, phone, email, state } = body.billing;
      // asignando id de mongo al contacto
      console.log('desde b');
      cleanLeadId = await createUpdateCleanLead(
        {
          first_name,
          last_name,
          phone,
          email,
          city,
          state,
          country: getCountryFromUrl(sourceUrl),
          url: sourceUrl,
        },
        labels,
      );
      order.ecommercesContactId = await createContact(
        first_name,
        last_name,
        phone,
        email,
        city,
        state,
        sourceUrl,
      );
    } else {
      // asignando id de mongo para el contacto creado y con id generado por Woocommerce
      order.ecommercesContactId = await getContactIdFromTodofull(
        order.customer_id,
        sourceUrl,
      );
    }
    // aca se puede aplicar transaccion de bd
    // actualizando estado para orden todofull
    checkLastOrderState(
      order.ecommercesContactId,
      order.status,
      cleanLeadId,
      order.woocommerceId,
      order.line_items.reduce((a, b) => a + parseFloat(b.total), 0),
      order.line_items,
      sourceUrl,
      order.idOrder,
      order,
    );
    await new EcommercesOrder(order).save();
    console.log('pedido nuevo creado... ', order.idOrder);
  }
}

async function createUpdateContact(customerId, sourceUrl, labels) {
  let contactToDB = {};
  let cleanLeadId = '';
  let ecommerceContact = await EcommercesContact.findOne({
    idContact: customerId,
    url: getUrl(sourceUrl),
  });
  console.log('buscando con esto: ', {
    idContact: customerId,
    url: getUrl(sourceUrl),
  });
  if (ecommerceContact) {
    // actualizando contacto
    let { first_name, last_name, city, phone, email, state } = ecommerceContact;
    console.log('desde c');
    cleanLeadId = await createUpdateCleanLead(
      {
        first_name,
        last_name,
        city,
        phone,
        email,
        state,
        country: getCountryFromUrl(sourceUrl),
        url: sourceUrl,
      },
      labels,
    ); // reconectar clean lead
  } else {
    // nuevo contacto
    console.log('creando nuevo Contactos...');
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
    console.log('desde d');
    cleanLeadId = await createUpdateCleanLead(contactToDB, labels);
    await new EcommercesContact(contactToDB).save();
    console.log('contacto nuevo creado...');
  }
  return cleanLeadId;
}

// recibe como parametro al ecommerceContact para crear registro en cleanLeads
async function createUpdateCleanLead(contactToDB, labels) {
  console.log('🚀 Aqui *** -> contactToDB', contactToDB);
  let cleanLeadId = '';
  if (contactToDB.phone && contactToDB.phone != '') {
    // creando lead del bot
    console.log('entrando a hacer algo...');
    let cleanPhone = formatPhone(contactToDB.phone);
    let cleanLead = await searchCleanLead(cleanPhone);
    if (cleanLead) {
      // actualizando array del lead
      console.log('existe lead...agregar fuente');
      // if (leadsMatch.some((el) => el.fuente != leadsMatch[0].fuente))
      // console.log('los repetidos: ', leadsMatch);
      let sameFuente = cleanLead.details.find(
        (el) =>
          el.fuente == getFuente(getUrl(contactToDB.url)) &&
          el.type === 'PAGINA',
      );
      if (getFuente(getUrl(contactToDB.url)) && !sameFuente) {
        cleanLead.details.push({
          type: 'PAGINA',
          fuente: getFuente(getUrl(contactToDB.url)),
          msnActivaDefault: '',
          nombre: `${contactToDB.first_name} ${contactToDB.last_name}`,
          email: contactToDB.email,
          ciudad: contactToDB.city,
          labels: [],
          pais: contactToDB.country,
        });
      } else {
        console.log('editando fuente....');
        if (sameFuente.type && sameFuente.type == 'PAGINA') {
          console.log('dddddd');
          let fullname = `${contactToDB.first_name} ${contactToDB.last_name}`;
          if (fullname.length > sameFuente.nombre) sameFuente.nombre = fullname;
          if (contactToDB.email && contactToDB.email.length > 0) {
            sameFuente.email = contactToDB.email;
          }
          if (contactToDB.ciudad && contactToDB.ciudad.length > 0) {
            sameFuente.ciudad = contactToDB.city;
          }
        }
      }
      cleanLead.estado = 'RE-CONECTAR';
      increaseCount('leadReconectarCount', contactToDB.country); // incrementando conteo
      cleanLead.fuente = getFuente(getUrl(contactToDB.url));
      await cleanLead.save();
      cleanLeadId = cleanLead._id; // recuperando id
      console.log('agregado nuevo detail!!');
    } else {
      // creando
      console.log('entrando a crear...');
      let leadDB = new CleanLeads({
        details: [
          {
            type: 'PAGINA',
            fuente: getFuente(getUrl(contactToDB.url)),
            msnActivaDefault: '',
            nombre: `${contactToDB.first_name} ${contactToDB.last_name}`,
            email: contactToDB.email,
            ciudad: contactToDB.city,
            labels: [],
            pais: contactToDB.country,
          },
        ],
        estado: 'RE-CONECTAR',
        telefono: contactToDB.phone,
        telefonoId: await assignAgent(
          cleanPhone,
          getFuente(getUrl(contactToDB.url)),
          contactToDB.first_name,
          contactToDB.last_name,
          contactToDB.email,
          contactToDB.country,
        ), // asignando agente
      });
      console.log('al guardar...: ', leadDB);
      increaseCount('leadReconectarCount', contactToDB.country); // incrementando conteo
      leadDB.fuente = getFuente(getUrl(contactToDB.url)); // agregando fuente para log
      await leadDB.save();
      cleanLeadId = leadDB._id;
      console.log('creado lead clean! ');
    }

    // agregando etiquetas
    for (const label of labels) {
      colocarEtiquetaFB(
        getFuente(getUrl(contactToDB.url)),
        label.idLabel,
        'details.fuente',
        cleanLeadId,
        'PAGINA',
      );
    }
  }
  return cleanLeadId;
}

async function getContactFromWoocommerce(customerId, sourceUrl) {
  let BASE_URL;
  let USERNAME;
  let PASSWORD;
  let buff;
  let base64data;
  // se obtienen las credenciales para hacer la consulta a woocommerce
  let credential = await getCredential(sourceUrl);
  BASE_URL = getUrl(sourceUrl);
  USERNAME = credential.consumerKey;
  PASSWORD = credential.consumerSecret;
  buff = new Buffer(`${USERNAME}:${PASSWORD}`);
  base64data = buff.toString('base64');
  let res;
  try {
    res = await axios({
      method: 'get',
      url: `${BASE_URL}/wp-json/wc/v3/customers/${customerId}`,
      withCredentials: true,
      headers: {
        Authorization: `Basic ${base64data}`,
      },
    });
  } catch (error) {
    console.log('error 2: ', error);
  }
  return res.data;
}

async function deleteProduct(req) {
  console.log('Eliminando producto...: ', req.body.id);
  let ecommerce = await Ecommerce.findOne({ idEcommerce: req.body.id });
  await ecommerce.remove();
  console.log('Producto eliminado...', req.body.id);
}

function getUrl(text) {
  return `https://${extractDomain(text)}`;
}

function getCountryFromUrl(url) {
  if (url.includes('.cl')) {
    return 'Chile';
  }
  if (url.includes('.pe')) {
    return 'Peru';
  }
  return 'Colombia';
}

async function getVariations(productId, sourceUrl) {
  let BASE_URL;
  let USERNAME;
  let PASSWORD;
  let buff;
  let base64data;
  // se obtienen las credenciales para hacer la consulta a woocommerce
  let credential = await getCredential(sourceUrl);
  BASE_URL = getUrl(sourceUrl);
  USERNAME = credential.consumerKey;
  PASSWORD = credential.consumerSecret;
  buff = new Buffer(`${USERNAME}:${PASSWORD}`);
  base64data = buff.toString('base64');
  let res;
  try {
    res = await axios({
      method: 'get',
      url: `${BASE_URL}/wp-json/wc/v3/products/${productId}/variations`,
      withCredentials: true,
      headers: {
        Authorization: `Basic ${base64data}`,
      },
    });
  } catch (error) {
    console.log('error 1: ', error);
  }
  return res.data;
}

async function getCredential(domain) {
  let credentials = await Woocommerce.find();
  return credentials.find(
    (woocommerce) => extractDomain(woocommerce.domain) == extractDomain(domain),
  );
}

async function getContactIdFromTodofull(customerId, sourceUrl) {
  let contact = await EcommercesContact.findOne({
    idContact: customerId,
    url: getUrl(sourceUrl),
  });
  return contact ? contact._id : null;
}

async function createContact(
  first_name,
  last_name,
  phone,
  email,
  city,
  state,
  sourceUrl,
) {
  let contact = await EcommercesContact.findOne({
    email,
    url: getUrl(sourceUrl),
  });
  let contactDB = new EcommercesContact();
  if (!contact) {
    console.log('creando Contacto con correo: ', email);
    // crear contacto
    contactDB.date_created = new Date();
    contactDB.date_modified = new Date();
    contactDB.first_name = first_name;
    contactDB.last_name = last_name;
    contactDB.phone = phone;
    contactDB.email = email;
    contactDB.city = city;
    contactDB.state = state;
    contactDB.country = getCountryFromUrl(sourceUrl);
    contactDB.url = getUrl(sourceUrl);
    console.log('el nuevo contacto: ', contactDB);
    await contactDB.save();
  }
  return contact ? contact._id : contactDB._id;
}

function getFuente(domain) {
  let fuentes = {
    'https://mujeron.cl': '6014941a32389f4af462d478',
    'https://fajassalome.cl': '6014b7a0bffbfd0017c1c2f2',
    'https://mujeron.pe': '6014b781bffbfd0017c1c2ef',
    'https://pushup.cl': '6014b794bffbfd0017c1c2f1',
  };
  return fuentes[domain];
}

async function assignAgent(
  telefono,
  fuente,
  firstName,
  lastName,
  email,
  country,
) {
  console.log('asignando agente');
  let woocommerces = await Woocommerce.find({}); // paginas woocommerce
  let telefonoId;
  // buscando si el telefono del lead está asignado a algun agentee
  let query = await checkQueryString({
    filter: formatPhone(telefono),
    fields: 'celular',
  });
  let googleContactAgents = await getItems2(Contacto, query);
  if (googleContactAgents.length > 0) {
    console.log('lo tienen varios...');
    // el numero lo tienen varios agentes
    let admin = googleContactAgents.find((el) =>
      woocommerces.find(
        (woocommerce) => woocommerce.telefonoId == el.telefonoId._id,
      ),
    );
    if (admin) {
      console.log('es admin: ', admin.telefonoId._id);
      // createChatbotLead(admin.telefonoId._id);
      telefonoId = admin.telefonoId._id;
    } else if (googleContactAgents.length == 1) {
      console.log('pertenece a 1:', googleContactAgents[0].telefonoId._id);
      telefonoId = googleContactAgents[0].telefonoId._id;
      // createChatbotLead(googleContactAgents[0].telefonoId._id);
    } else {
      console.log('pertenece a 2 o mas...');
      let randomGoogleContactAgent =
        googleContactAgents[random(0, googleContactAgents.length - 1)];
      console.log(
        'el random seleccionado: ',
        randomGoogleContactAgent.telefonoId._id,
      );
      telefonoId = randomGoogleContactAgent.telefonoId._id;
      // createChatbotLead(randomGoogleContactAgent.telefonoId._id);
    }
  } else {
    // el numero no lo tenia ningun agente, asignando admin
    telefonoId = woocommerces.find((woocommerce) => woocommerce._id == fuente)
      .telefonoId._id;
    console.log('admin asignado...', telefonoId);
    addLeadGoogleContact(
      firstName,
      lastName,
      formatPhone(telefono, country),
      email,
      telefonoId,
    );
  }
  console.log('retornando telefonoId: ', telefonoId);
  return telefonoId;
}

async function addLeadGoogleContact(
  firstName,
  lastName,
  telefono,
  email,
  telefonoId,
) {
  console.log('agregando a google contact...');
  try {
    await axios.post(`${process.env.API_URL}/api/contactos`, {
      celular: telefono,
      nombre: firstName,
      apellido: lastName,
      email,
      telefonoId,
    });
    console.log('agregado con exito');
  } catch (error) {}
}

async function updateProductCategoriesIds(productCategories, country) {
  let updatedCategories = JSON.parse(JSON.stringify(productCategories));
  try {
    let categories = await EcommercesCategories.find().lean();
    for (let i = 0; i < updatedCategories.length; i++) {
      let categoryDB = categories.find(
        (el) =>
          el.idCategory == updatedCategories[i].id && el.country == country,
      );
      if (categoryDB) {
        updatedCategories[i]._id = mongoose.Types.ObjectId(categoryDB._id);
      }
    }
  } catch (error) {
    console.log('hubo un error: ', error);
  }
  console.log('retornando estas categorias: ', updatedCategories);
  return updatedCategories;
}

/**
 * Esta función corresponde a la gráfica estado pedidos Woocommerce (miro.com)
 */

async function checkLastOrderState(
  ecommercesContactId,
  status,
  cleanLeadId,
  woocommerceId,
  total, // total de la venta
  products,
  sourceUrl,
  orderId,
  order,
) {
  // busqueda en base id de mongo
  let finalStatus = '';
  let cleanLeadStatusChanged = false;
  let orders = await EcommercesOrder.find({ ecommercesContactId })
    .sort({
      date_modified: -1,
    })
    .limit(3);
  if (orders.length > 0) {
    // habian ordenes anteriores
    // revision estado orden anterior
    let lastStatus = orders[0].status;
    if (
      lastStatus == 'failed' ||
      lastStatus == 'cancelled' ||
      lastStatus == 'on-hold' ||
      status == 'pending'
    ) {
      // cambiar estado a reintentó
      orders[0].status = 're-intento';
      // guardando orden anterior
      orders[0].save();
      // actualizando woocoomerce status order
      // updateWoocommerceOrderStatus(orders[0].idOrder, sourceUrl);
      // solicitud api woocommerce
    } else {
      finalStatus = status;
    }
  }
  // no habian anteriores
  // obteniendo lead para actualizar estado chatbot
  let cleanLead = await CleanLeads.findOne({ _id: cleanLeadId });

  if (cleanLead) {
    console.log('actualizando lead a nuevos estados: ', cleanLeadId);
    if (
      status == 'failed' ||
      status == 'cancelled' ||
      status == 'on-hold' ||
      status == 'pending'
    ) {
      // cambiar estado a reintentó
      if (cleanLead.estado != 'SIN ASIGNAR') {
        cleanLead.estado = 'COMPRA FALLIDA';
        cleanLeadStatusChanged = true;
      }
      // solicitud api woocommerce
    } else if (status == 'processing') {
      cleanLead.estado = 'COMPRA REALIZADA';
      cleanLeadStatusChanged = true;
    } else if (status == 'completed' || status == 'refunded') {
      cleanLead.estado = 'CONTACTADO';
    }
    if (cleanLeadStatusChanged) {
      // actualizando nota
      if (cleanLead.details.length > 0) {
        let detailToUpdate = cleanLead.details.find(
          (detail) => detail.fuente == woocommerceId,
        );
        if (detailToUpdate) {
          // poblando productos
          let completeProducts = [];
          for (const product of products) {
            completeProducts.push(
              await getProductById(
                product.idEcommerce,
                getCountryFromUrl(sourceUrl),
              ),
            );
          }
          // agregando atributos de la orden a productos
          completeProducts = completeProducts.map((product) => ({
            ...product,
            meta_data: order.line_items.find(
              (item) => item.idEcommerce === product.idEcommerce,
            ).meta_data,
          }));

          // actualizando nota para pagina - bot lead
          detailToUpdate.nota = `Hemos recibido una alerta por que tu Cliente:\n*${
            detailToUpdate.nombre
          }* con teléfono *${
            cleanLead.telefono
          }*\n tiene una compra *${getSpanishState(status)}*            
Por un valor de $ ${total}\n`;
          detailToUpdate.nota += `*- Página*: ${
            (await getSourceById(getFuente(getUrl(sourceUrl)))).name
          }\n`;
          detailToUpdate.nota += `*- Orden*: ${order.idOrder}\n`;
          detailToUpdate.nota += '*Productos:*\n';
          for (const product of completeProducts) {
            detailToUpdate.nota += `*- Producto*: ${product.name}\n`;
            detailToUpdate.nota += `*- Detalles*: ${product.meta_data.map(
              (el) => `${el.display_key} -> ${el.value} `,
            )}\n`;
          }
        }
      }
    }
    if (getSpanishState(status)) {
      cleanLead.sendWhatsapp = true; // este campo es para que el mensaje no se repita
      cleanLead.sendWhatsappSource = 'ORDER'; // este campo es para que el mensaje no se repita
    }
    cleanLead.fuente = getFuente(getUrl(sourceUrl)); // para log estados
    await cleanLead.save(); // guardando cambio de estado de bot lead
  } else {
    console.log('lead no encontrado para nueva act...');
  }
  finalStatus = status;
  return finalStatus; // retornando estado final
}

async function getProductById(idEcommerce, country) {
  let product = await Ecommerce.findOne({ idEcommerce, country }).lean();
  return product || {};
}

async function updateWoocommerceOrderStatus(orderId, sourceUrl) {
  let BASE_URL;
  let USERNAME;
  let PASSWORD;
  let buff;
  let base64data;
  // se obtienen las credenciales para hacer la consulta a woocommerce
  let credential = await getCredential(sourceUrl);
  BASE_URL = getUrl(sourceUrl);
  USERNAME = credential.consumerKey;
  PASSWORD = credential.consumerSecret;
  buff = new Buffer(`${USERNAME}:${PASSWORD}`);
  base64data = buff.toString('base64');
  try {
    await axios({
      method: 'put',
      url: `${BASE_URL}/wp-json/wc/v3/orders/${orderId}`,
      data: { status: 're-intento' },
      withCredentials: true,
      headers: {
        Authorization: `Basic ${base64data}`,
      },
    });
    console.log('estado de woocommerce actualizado con exito...');
  } catch (error) {
    console.log('error al actualizar estado de woocommerce');
    console.log('error 2: ', error);
  }
}

async function getLabelsIdFromOrder(lineItems, country) {
  let labels = [];
  for (const item of lineItems) {
    let productId = item.product_id;
    // buscando producto en BD
    let productDB = await Ecommerce.findOne({
      idEcommerce: productId,
      country,
    }).lean();
    if (productDB) {
      let categories = productDB.categories;
      // buscando labels emparejados
      let localLabels = await Promise.all(
        categories.map((category) =>
          FacebookLabels.findOne({ foreignLabelId: category._id }).lean(),
        ),
      );
      labels = [...labels, ...localLabels];
    }
    // buscando tallas en medatada
    let metaData = item.meta_data;
    let tallas = metaData.filter(
      (el) => el.display_key === 'Talla' || el.display_key === 'talla',
    );
    let tallaLabels = await Promise.all(
      tallas.map((el) => searchLabel(el.display_value, country)),
    );
    labels = [...labels, ...tallaLabels];
  }
  return labels.filter((el) => el);
}

function getSpanishState(state) {
  let states = {
    cancelled: 'Cancelado',
    completed: 'Completado',
    pending: 'Pendiente',
    processing: 'Procesando',
    failed: 'Fallido',
    're-intento': 'Re intentó',
    refunded: 'Reembolsado',
  };
  return states[state];
}

module.exports = router;
