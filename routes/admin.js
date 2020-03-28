const express = require("express");

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
router.post("/add-product", isAdmin, adminController.postUploadProduct);

// /products -> GET
router.get("/products", isAdmin, adminController.getProducts);

// /edit-product -> GET

// /edit-product -> POST

// /delete-product -> POST
router.post('/delete-product', isAdmin, adminController.postDeleteProduct);

module.exports = router;
