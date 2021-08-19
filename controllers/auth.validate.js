const { check } = require('express-validator');
const { validationResult } = require('../helpers/utils');

/**
 * Validates register request
 */
exports.register = [
  check('first_name')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('last_name')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('email')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isEmail()
    .withMessage('EMAIL_IS_NOT_VALID'),
  check('password')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isLength({
      min: 5,
    })
    .withMessage('La contraseña debe tener al menos 5 caracteres'),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];

/**
 * Validates login request
 */
exports.login = [
  check('email')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isEmail()
    .withMessage('EMAIL_IS_NOT_VALID'),
  check('password')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isLength({
      min: 5,
    })
    .withMessage('La contraseña debe tener al menos 5 caracteres'),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];

/**
 * Validates verify request
 */
exports.verify = [
  check('id')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];

/**
 * Validates forgot password request
 */
exports.forgotPassword = [
  check('email')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isEmail()
    .withMessage('EMAIL_IS_NOT_VALID'),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];

/**
 * Validates reset password request
 */
exports.resetPassword = [
  check('id')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('password')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isLength({
      min: 5,
    })
    .withMessage('La contraseña debe tener al menos 5 caracteres'),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];
