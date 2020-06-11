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
    body('category').custom( value => {
      if(!value) throw new Error("Category can not be empty");

      if( Array.isArray(value) && value.length > 0 )
        return true;
      else
        if(value.length > 0)return true;
    }),
    body('quantity').isString().trim(),
    body('minage').isNumeric(),
    body('maxage').isNumeric(),
    body('gender').isString().trim(),
    body('occasion').custom( value => {
      if(!value) throw new Error("Occasion can not be empty");

      if( Array.isArray(value) && value.length > 0 )
        return true;
      else
        if(value.length > 0)return true;
    }),
  ], isAdmin, adminController.postUploadProduct);

// /products -> GET
router.get("/products", isAdmin, adminController.getProducts);

// /edit-product -> GET
router.get('/edit-product/:productId', isAdmin, adminController.getEditProduct);

// /edit-product -> POST
router.post('/edit-product', 
  [
    body('title').isString().isLength({ min: 3 }).trim(),
    body('price').isNumeric(),
    body('imageUrl').isURL(),
    body('description').isString().isLength({ min: 5, max: 500 }).trim(),
    body('category').custom( value => {
      if(!value) throw new Error("Category can not be empty");

      if( Array.isArray(value) && value.length > 0 )
        return true;
      else
        if(value.length > 0)return true;
    }),
    body('quantity').isNumeric().trim(),
    body('minage').isNumeric(),
    body('maxage').isNumeric(),
    body('gender').isString().trim(),
    body('occasion').custom( value => {
      if(!value) throw new Error("Occasion can not be empty");

      if( Array.isArray(value) && value.length > 0 )
        return true;
      else
        if(value.length > 0)return true;
    }),
  ], isAdmin, adminController.postEditProduct);

// /delete-product -> POST
router.post('/delete-product', isAdmin, adminController.postDeleteProduct);

// /orders -> GET
router.get('/orders', isAdmin, adminController.getAdminOrders);

// /change-order-status -> POST
router.post('/change-order-status', isAdmin, adminController.postAdminOrderStatus);

// /order/orderId -> GET
router.get('/orders/:orderId', isAdmin, adminController.getOrderDetails);

// /assign-order-rider -> POST
router.post('/assign-order-rider', isAdmin, adminController.assignOrderToRider);

module.exports = router;
