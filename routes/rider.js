const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const Rider = require('../models/rider');
const riderController = require('../controllers/rider');
const isRider = require('../middleware/is-rider');

// /login -> GET
router.get('/login', riderController.getRiderLogin);

// /login -> POST
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password', 'Please enter a password with only numbers and text and atleast 6 characters')
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric()
  ],
  riderController.postRiderLogin
);

// /signup -> GET
router.get('/signup', riderController.getRiderSignup);

// /signup -> POST
router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return Rider.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('A user corresponding to this email already exists');
          }
        });
      })
      .normalizeEmail(),
    body('password', 'Please enter a password with only numbers and text and atleast 6 characters')
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
  riderController.postRiderSignup
);

// /rider-portal -> GET
router.get('/rider-portal', isRider, riderController.getRiderPortal);

// /rider-portal/:assignedOrderId -> GET
router.get('/rider-portal/:assignedOrderId', isRider, riderController.getAssignedOrderDetails);

// /rider-portal/change-order-status -> POST
router.post('/rider-portal/change-order-status', isRider, riderController.postRiderOrderStatus);

module.exports = router;
