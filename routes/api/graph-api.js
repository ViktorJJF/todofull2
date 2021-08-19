const express = require('express');
const passport = require('passport');
const trimRequest = require('trim-request');
const controller = require('../../controllers/graphApiController');
// const validate = require('../../controllers/brands.validate');
const AuthController = require('../../controllers/authController');

const router = express.Router();
require('../../config/passport');

const requireAuth = passport.authenticate('jwt', {
  session: false,
});

router.get(
  '/get-labels-by-fbid/:botId/:fbId',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.getLabels,
);

router.post(
  '/labels',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.createLabel,
);
router.delete(
  '/labels/:labelId',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.deleteLabel,
);

//este endpoint es para obtener la imagen como vista previa de la publicacion
router.get(
  '/:botId/:postId',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.getPostPicture,
);

module.exports = router;
