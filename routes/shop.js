const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

// / -> GET (Default route)
router.get('/', shopController.getIndex);

// /products -> GET (View products)
router.get('/products', shopController.getProducts);

// /products/:productId -> GET (View individual product)
router.get('/products/:productId', shopController.getProduct);

// /cart -> GET (View user cart)
router.get('/cart', isAuth, shopController.getCart);

// /cart -> POST
router.post('/cart', isAuth, shopController.postCart);

// /cart-delete-item -> POST
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

// /orders -> GET (View user orders)

// /create-order -> POST

// /recommend-products -> POST 
router.post("/recommend-products", shopController.postRecommendProducts);


module.exports = router;