const express = require('express');
const passport = require('passport');
const trimRequest = require('trim-request');
const controller = require('../../controllers/cleanLeadsController');
// const validate = require('../../controllers/brands.validate');
const AuthController = require('../../controllers/authController');

const router = express.Router();
require('../../config/passport');

const requireAuth = passport.authenticate('jwt', {
  session: false,
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
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  controller.list,
);

/*
 * Create new item route
 */
router.post(
  '/',
  trimRequest.all,
  // validate.create,
  controller.create,
);

/*
 * Create new item label route
 */
router.post(
  '/:path/labels',
  trimRequest.all,
  // validate.create,
  controller.createFacebookLabel,
);

/*
 * Get item route
 */
router.get(
  '/list-one-advanced/:path/:value',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.listOne,
  controller.listOneAdvanced,
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
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.update,
  controller.update,
);

/*
 * Delete item route
 */
router.delete(
  '/:id',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.deletes,
  controller.deletes,
);

/**
 * Otros metodos
 */

router.post(
  '/auto-assign-agent',
  // requireAuth,
  // AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  // validate.deletes,
  controller.autoAssignAgent,
);

module.exports = router;
