const express = require("express");

const adminController = require("../controllers/admin");

const router = express.Router();

// /login -> GET
router.get("/login", adminController.getAdminLogin);

// /login -> POST
router.post("/login", adminController.postAdminLogin);

// /add-product -> GET
router.get("/add-product", adminController.getUploadProduct);
// /add-product -> POST
router.post("/add-product", adminController.postUploadProduct);
// /products -> GET

// /edit-product -> GET

// /edit-product -> POST

module.exports = router;
