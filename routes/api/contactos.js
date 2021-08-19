const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const extractDomain = require('extract-domain');
const express = require('express');
const passport = require('passport');
const trimRequest = require('trim-request');
const controller = require('../../controllers/contactosController');
// const validate = require('../../controllers/brands.validate');
const AuthController = require('../../controllers/authController');
const Woocommerce = require('../../models/Woocommerces');
const axios = require('axios');

const router = express.Router();
require('../../config/passport');

const requireAuth = passport.authenticate('jwt', {
  session: false,
});

router.get('/test', async (req, res) => {
  const { customerId, sourceUrl } = req.body;
  let contacto = await getContactFromWoocommerce(customerId, sourceUrl);
  console.log('el contacto: ', contacto);
  res.status(200).json({ ok: true, contacto });
});
/*
 * Get all items route
 */
router.get('/all', controller.listAll);

/*
 * Get items route
 */
router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.list,
);

/*
 * Create new item route
 */
router.post(
  '/',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.create,
  controller.create,
);

/*
 * Get item route
 */
router.get(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.listOne,
  controller.listOne,
);

/*
 * Update item route
 */
router.put(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.update,
  controller.update,
);

/*
 * Delete item route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.deletes,
  controller.deletes,
);

router.delete(
  '/deletes-by-telefonoid/:telefonoId',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.deletes,
  controller.deletesAllByTelefonoId,
);

// borrar esto
async function getContactFromWoocommerce(customerId, sourceUrl) {
  let BASE_URL, USERNAME, PASSWORD, buff, base64data;
  //se obtienen las credenciales para hacer la consulta a woocommerce
  let credential = await getCredential(sourceUrl);
  BASE_URL = getUrl(sourceUrl);
  USERNAME = credential.consumerKey;
  PASSWORD = credential.consumerSecret;
  // buff = new Buffer(USERNAME + ':' + PASSWORD);
  // base64data = buff.toString('base64');
  let res;
  // try {
  //   res = await axios.get(BASE_URL + '/wp-json/wc/v3/customers/' + customerId, {
  //     auth: {
  //       username: USERNAME,
  //       password: PASSWORD,
  //     },
  //   });
  //   // res = await axios({
  //   //   method: 'get',
  //   //   url: BASE_URL + '/wp-json/wc/v3/customers/' + customerId,
  //   //   withCredentials: true,
  //   //   headers: {
  //   //     Authorization: 'Basic ' + base64data,
  //   //   },
  //   // });
  // } catch (error) {
  //   console.log('error 2: ', error);
  // }

  const api = new WooCommerceRestApi({
    url: BASE_URL,
    consumerKey: USERNAME,
    consumerSecret: PASSWORD,
    version: 'wc/v3',
  });
  console.log('la api: ', api);
  res = await api.get('customers/' + customerId);
  console.log('el res: ', res);

  return res.data;
}

async function getCredential(domain) {
  let credentials = await Woocommerce.find().lean();
  return credentials.find(
    (woocommerce) => extractDomain(woocommerce.domain) == extractDomain(domain),
  );
}

function getUrl(text) {
  return 'https://' + extractDomain(text);
}

module.exports = router;
