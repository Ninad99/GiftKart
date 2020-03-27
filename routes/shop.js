const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');

// / -> GET (Default route)
router.get('/', shopController.getIndex);

// /products -> GET (View products)
router.get('/products', shopController.getProducts);

// /products/:productId -> GET (View individual product)
router.get('/products/:productId', shopController.getProduct);

// /cart -> GET (View user cart)

// /cart -> POST

// /card-delete-item -> POST

// /orders -> GET (View user orders)

// /create-order -> POST

// /recommend-products -> POST 
router.post("/recommend-products", shopController.postRecommendProducts);


module.exports = router;