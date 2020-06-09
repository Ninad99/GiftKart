const express = require('express');

const riderController = require('../controllers/rider');

const router = express.Router();

// /login -> GET
router.get('/login', riderController.getRiderLogin);

// /login -> POST
router.post('/login', riderController.postRiderLogin);

// add more routes

module.exports = router;
