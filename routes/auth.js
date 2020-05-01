const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

// /login -> GET
router.get('/login', authController.getLogin);

// /login -> POST
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body(
      'password',
      'Please enter a password with only numbers and text and atleast 6 characters'
    )
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric()
  ],
  authController.postLogin
);

// /signup -> GET
router.get('/signup', authController.getSignup);

// /signup -> POST
router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              'A user corresponding to this email already exists'
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      'password',
      'Please enter a password with only numbers and text and atleast 6 characters'
    )
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
  ],
  authController.postSignup
);

// /logout -> POST
router.post('/logout', authController.postLogout);

// /password-reset -> GET
router.get('/reset', authController.getReset);

// /password-reset -> POST
router.post('/reset', authController.postReset);

// /password-reset/:token -> GET
router.get('/reset/:token', authController.getNewPassword);

// /new-password -> POST
router.post(
  '/new-password',
  [
    body(
      'password',
      'Please enter a password with only numbers and text and atleast 6 characters'
    )
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postNewPassword
);

module.exports = router;
