const Product = require('../models/product');

exports.getIndex = (req, res, next) => {
  return res.render('shop/index', {
    pageTitle: 'GiftKart | Home',
    path: '/'
  });
}

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      return res.render('shop/product-list', {
        prods: products,
        pageTitle: 'GiftKart | All Products',
        path: '/products'
      });
    })
    .catch(err => console.log(err));
}

exports.getProduct = (req, res, next) => {
  const prodID = req.params.productId;
  Product.findById(prodID)
    .then(product => {
      return res.render('shop/product-detail', {
        product: product,
        pageTitle: `View Product | ${product.title}`,
        path: '/products'
      });
    })
    .catch(err => console.log(err)); 
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const totalAmount = user.cart.items.reduce((acc, curr) => {
        return (curr.quantity * curr.productId.price) + acc;
      }, 0);
      res.render('shop/cart', {
        pageTitle: 'GiftKart | Your Cart',
        path: '/cart',
        products: user.cart.items,
        totalAmount: totalAmount
      });
    })
    .catch(err => console.log(err));
}

exports.postCart = (req, res, next) => {
  const prodID = req.body.productId;
  Product.findById(prodID)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => console.log(err))
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
}


exports.postRecommendProducts = (req, res, next) => {
	console.log(req.body);
	//handle further

	Product.find()
		.then(products => {
			return res.render("shop/recommend-products", {
				prods: products,
				pageTitle: "GiftKart | Recommended Products",
				path: "/recommend-products"
			});
		})
		.catch(err => console.log(err));
};

