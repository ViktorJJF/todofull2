const express = require('express');
const passport = require('passport');
const trimRequest = require('trim-request');
const controller = require('../../controllers/googlePeopleController');
// const validate = require('../../controllers/brands.validate');
const AuthController = require('../../controllers/authController');

const router = express.Router();
require('../../config/passport');

const requireAuth = passport.authenticate('jwt', {
  session: false,
});

router.post(
  '/generateurl',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.generateURL,
);

router.post(
  '/generatetokens',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.generateTokens,
);

router.post(
  '/contacts-preview',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.contactsPreview,
);

router.post(
  '/contacts-export',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  // trimRequest.all,
  controller.contactsExport,
);

router.post(
  '/contacts/create',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.contactsCreate,
);
router.delete(
  '/contacts/delete',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.contactsDelete,
);
router.put(
  '/contacts/update',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.contactsUpdate,
);

module.exports = router;
