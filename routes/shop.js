const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

// / -> GET (Default route)
router.get('/', shopController.getIndex);

// /products -> GET (View products)
router.get("/products", shopController.getProducts);

// recomended-prods -> POST
router.post("/products", shopController.postProducts);

// /products/:productId -> GET (View individual product)
router.get('/products/:productId', shopController.getProduct);

// /cart -> GET (View user cart)
router.get('/cart', isAuth, shopController.getCart);

// /cart -> POST
router.post('/cart', isAuth, shopController.postCart);

// /cart-delete-item -> POST
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

// /orders -> GET (View user orders)
router.get('/orders', isAuth, shopController.getOrders);

// /create-order -> POST
router.post(
	"/create-order",
	[
		body("name").isString().notEmpty().trim(),
		body("house").isString().notEmpty().trim(),
		body("street").isString().notEmpty().trim(),
		body("city").isString().notEmpty().trim(),
		body("PIN").custom((value) => {
      if (value && value.length === 6) return true;
      
			throw new Error("Invalid PIN");
		}),
	],
	isAuth,
	shopController.postOrder
);

// recommend-product-index -> GET
router.get("/recommend-products", shopController.getRecommendProductIndex);

// autocomplete route -> POST 
router.get("/autocomplete", shopController.autocomplete);

// search-prodicts route -> POST 
router.post("/search-products", shopController.searchProducts);


module.exports = router;