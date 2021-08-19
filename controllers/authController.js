const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { addHours } = require('date-fns');
const { matchedData } = require('express-validator');
const User = require('../models/Users');
const UserAccess = require('../models/UserAccess');
const ForgotPassword = require('../models/ForgotPassword');
const utils = require('../helpers/utils');
const auth = require('../helpers/auth');
const emailer = require('../helpers/emailer');
const { da } = require('date-fns/locale');

const HOURS_TO_BLOCK = 2;
const LOGIN_ATTEMPTS = 5;

/** *******************
 * Private functions *
 ******************** */

/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = (user) => {
  // Gets expiration time
  const expiration =
    Math.floor(Date.now() / 1000) + 60 * process.env.JWT_EXPIRATION_IN_MINUTES;
  //   returns signed and encrypted token
  return auth.encrypt(
    jwt.sign(
      {
        data: {
          _id: user,
        },
        exp: expiration,
      },
      process.env.JWT_SECRET,
    ),
  );
};

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = (req) => {
  let user = {
    _id: req._id,
    first_name: req.first_name,
    last_name: req.last_name,
    img: req.img,
    email: req.email,
    role: req.role,
    verified: req.verified,
  };
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== 'production') {
    user = {
      ...user,
      verification: req.verification,
    };
  }
  return user;
};

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user) =>
  new Promise((resolve, reject) => {
    const userAccess = new UserAccess({
      email: user.email,
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req),
      country: utils.getCountry(req),
    });
    userAccess.save((err) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      const userInfo = setUserInfo(user);
      // Returns data with access token
      resolve({
        token: generateToken(user._id),
        user: userInfo,
      });
    });
  });

/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async (user) =>
  new Promise((resolve, reject) => {
    user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK);
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      if (result) {
        resolve(utils.buildErrObject(409, 'BLOCKED_USER'));
      }
    });
  });

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLoginAttemptsToDB = async (user) =>
  new Promise((resolve, reject) => {
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      if (result) {
        resolve(true);
      }
    });
  });

/**
 * Checks that login attempts are greate in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = (user) =>
  user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date();

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async (user) =>
  new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0;
      user.save((err, result) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message));
        }
        if (result) {
          resolve(true);
        }
      });
    } else {
      // User is not blocked, check password (normal behaviour)
      resolve(true);
    }
  });

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async (user) =>
  new Promise((resolve, reject) => {
    if (user.blockExpires > new Date()) {
      reject(utils.buildErrObject(409, 'BLOCKED_USER'));
    }
    resolve(true);
  });

/**
 * Finds user by email
 * @param {string} email - user´s email
 */
const findUser = async (email) =>
  new Promise((resolve, reject) => {
    User.findOne(
      {
        email,
      },
      'password loginAttempts blockExpires first_name last_name img phone city country email role verified verification',
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'La cuenta no existe');
        resolve(item);
      },
    );
  });

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async (userId) =>
  new Promise((resolve, reject) => {
    User.findById(userId, (err, item) => {
      utils.itemNotFound(err, item, reject, 'La cuenta no existe');
      resolve(item);
    });
  });

/**
 * Adds one attempt to loginAttempts, then compares
 * loginAttempts with the constant LOGIN_ATTEMPTS, tion
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async (user) => {
  user.loginAttempts += 1;
  await saveLoginAttemptsToDB(user);
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, 'La contraseña es incorrecta'));
    } else {
      resolve(blockUser(user));
    }
    reject(utils.buildErrObject(422, 'ERROR'));
  });
};

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async (body) =>
  new Promise((resolve, reject) => {
    body.verification = uuid.v4();
    const user = new User(body);
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve(item);
    });
  });

/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
  if (process.env.NODE_ENV !== 'production') {
    userInfo.verification = item.verification;
  }
  const data = {
    token: generateToken(item._id),
    user: userInfo,
  };
  return data;
};

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */
const verificationExists = async (id) =>
  new Promise((resolve, reject) => {
    User.findOne(
      {
        verification: id,
        verified: false,
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND_OR_ALREADY_VERIFIED');
        resolve(user);
      },
    );
  });

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async (user) =>
  new Promise((resolve, reject) => {
    user.verified = true;
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve({
        email: item.email,
        verified: item.verified,
      });
    });
  });

/**
 * Marks a request to reset password as used
 * @param {Object} req - request object
 * @param {Object} forgot - forgot object
 */
const markResetPasswordAsUsed = async (req, forgot) =>
  new Promise((resolve, reject) => {
    forgot.used = true;
    forgot.ipChanged = utils.getIP(req);
    forgot.browserChanged = utils.getBrowserInfo(req);
    forgot.countryChanged = utils.getCountry(req);
    forgot.save((err, item) => {
      utils.itemNotFound(err, item, reject, 'NOT_FOUND');
      resolve(utils.buildSuccObject('PASSWORD_CHANGED'));
    });
  });

/**
 * Updates a user password in database
 * @param {string} password - new password
 * @param {Object} user - user object
 */
const updatePassword = async (password, user) =>
  new Promise((resolve, reject) => {
    user.password = password;
    user.save((err, item) => {
      utils.itemNotFound(err, item, reject, 'NOT_FOUND');
      resolve(item);
    });
  });

/**
 * Finds user by email to reset password
 * @param {string} email - user email
 */
const findUserToResetPassword = async (email) =>
  new Promise((resolve, reject) => {
    User.findOne(
      {
        email,
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND');
        resolve(user);
      },
    );
  });

/**
 * Checks if a forgot password verification exists
 * @param {string} id - verification id
 */
const findForgotPassword = async (id) =>
  new Promise((resolve, reject) => {
    ForgotPassword.findOne(
      {
        verification: id,
        used: false,
      },
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'NOT_FOUND_OR_ALREADY_USED');
        resolve(item);
      },
    );
  });

/**
 * Creates a new password forgot
 * @param {Object} req - request object
 */
const saveForgotPassword = async (req) =>
  new Promise((resolve, reject) => {
    const forgot = new ForgotPassword({
      email: req.body.email,
      verification: uuid.v4(),
      ipRequest: utils.getIP(req),
      browserRequest: utils.getBrowserInfo(req),
      countryRequest: utils.getCountry(req),
    });
    forgot.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve(item);
    });
  });

/**
 * Builds an object with created forgot password o
 * bject, if env is development or testing exposes the verification
 * @param {Object} item - created forgot password object
 */
const forgotPasswordResponse = (item) => {
  let data = {
    msg: 'RESET_EMAIL_SENT',
    email: item.email,
  };
  if (process.env.NODE_ENV !== 'production') {
    data = {
      ...data,
      verification: item.verification,
    };
  }
  return data;
};

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) =>
  new Promise((resolve, reject) => {
    User.findById(data.id, (err, result) => {
      utils.itemNotFound(err, result, reject, 'NOT_FOUND');
      if (data.roles.indexOf(result.role) > -1) {
        return resolve(next());
      }
      return reject(utils.buildErrObject(401, 'UNAUTHORIZED'));
    });
  });

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async (token) =>
  new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, 'BAD_TOKEN'));
      }
      resolve(decoded.data._id);
    });
  });

/** ******************
 * Public functions *
 ******************* */

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.login = async (req, res) => {
  try {
    const { body } = req;
    const user = await findUser(body.email);
    await userIsBlocked(user);
    await checkLoginAttemptsAndBlockExpires(user);
    const isPasswordMatch = await auth.checkPassword(body.password, user);
    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch(user));
    } else {
      // all ok, register access and return token
      user.loginAttempts = 0;
      await saveLoginAttemptsToDB(user);
      res.status(200).json(await saveUserAccessAndReturnToken(req, user));
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Register function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.register = async (req, res) => {
  try {
    const { body } = req;
    const doesEmailExists = await emailer.emailExists(body.email);
    if (!doesEmailExists) {
      const item = await registerUser(body);
      const userInfo = setUserInfo(item);
      const response = returnRegisterToken(item, userInfo);
      emailer.sendRegistrationEmailMessage(item);
      res.status(201).json({ ok: true, ...response });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
  try {
    req = matchedData(req);
    const user = await verificationExists(req.id);
    res.status(200).json(await verifyUser(user));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Forgot password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale();
    const data = matchedData(req);
    await findUser(data.email);
    const item = await saveForgotPassword(req);
    emailer.sendResetPasswordEmailMessage(locale, item);
    res.status(200).json(forgotPasswordResponse(item));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Reset password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const data = matchedData(req);
    const forgotPassword = await findForgotPassword(data.id);
    const user = await findUserToResetPassword(forgotPassword.email);
    await updatePassword(data.password, user);
    const result = await markResetPasswordAsUsed(req, forgotPassword);
    res.status(200).json(result);
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getRefreshToken = async (req, res) => {
  try {
    const tokenEncrypted = req.headers.authorization
      .replace('Bearer ', '')
      .trim();
    let userId = await getUserIdFromToken(tokenEncrypted);
    userId = await utils.isIDGood(userId);
    const user = await findUserById(userId);
    const token = await saveUserAccessAndReturnToken(req, user);
    // Removes user info from response
    delete token.user;
    res.status(200).json(token);
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Roles authorization function called by route
 * @param {Array} roles - roles specified on the route
 */
exports.roleAuthorization = (roles) => async (req, res, next) => {
  try {
    const data = {
      id: req.user._id,
      roles,
    };
    await checkPermissions(data, next);
  } catch (error) {
    utils.handleError(res, error);
  }
};
