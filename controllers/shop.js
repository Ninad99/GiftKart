const Product = require('../models/product');
const Order = require('../models/order');

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
        if (!curr.productId) {
          req.user.removeFromCartById(curr._id);
          return acc;
        }
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

exports.postOrder = (req, res, next) => {
  const totalAmount = req.body.totalamount;
  req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(item => {
        return {
          quantity: item.quantity,
          productData: { ...item.productId._doc }
        }
      })
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products,
        totalAmount: totalAmount,
        orderDate: new Date()
      })
      return order.save();
    }).then(result => {
      return req.user.clearCart();
    }).then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
}

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        pageTitle: 'Your Orders',
        path: '/orders',
        orders: orders
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
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

