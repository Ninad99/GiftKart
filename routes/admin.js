const express = require("express");
const { body } = require('express-validator');

const adminController = require("../controllers/admin");
const isAdmin = require("../middleware/is-admin");

const router = express.Router();

// /login -> GET
router.get("/login", adminController.getAdminLogin);

// /login -> POST
router.post("/login", adminController.postAdminLogin);

// /add-product -> GET
router.get("/add-product", isAdmin, adminController.getUploadProduct);

// /add-product -> POST
router.post("/add-product", 
  [
    body('title').isString().isLength({ min: 3 }).trim(),
    body('price').isNumeric(),
    body('imageUrl').isURL(),
    body('description').isString().isLength({ min: 5, max: 500 }).trim(),
    body('category').isString().trim(),
    body('quantity').isNumeric().trim(),
    body('minage').isNumeric(),
    body('maxage').isNumeric(),
    body('gender').isString().trim(),
    body('occasion').isString().trim()
  ], isAdmin, adminController.postUploadProduct);

// /products -> GET
router.get("/products", isAdmin, adminController.getProducts);

// /edit-product -> GET

// /edit-product -> POST

// /delete-product -> POST
router.post('/delete-product', isAdmin, adminController.postDeleteProduct);

module.exports = router;
