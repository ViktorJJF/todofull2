const express = require('express');
const passport = require('passport');
const trimRequest = require('trim-request');
const controller = require('../../controllers/usersController');
const validate = require('../../controllers/users.validate');
const AuthController = require('../../controllers/authController');

const router = express.Router();
require('../../config/passport');

const requireAuth = passport.authenticate('jwt', {
  session: false,
});

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
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  validate.create,
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
  validate.listOne,
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
  validate.update,
  controller.update,
);

router.put(
  '/:id/update-password',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  validate.update,
  controller.updatePassword,
);

/*
 * Delete item route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['SUPERADMIN', 'ADMIN']),
  trimRequest.all,
  validate.deletes,
  controller.deletes,
);

module.exports = router;
