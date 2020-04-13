const { validationResult } = require('express-validator');

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
  let fetchedProduct;

  Product.findById(prodID)
    .then(product => {
      fetchedProduct = product;
      const similarProductsQuery = {
        gender: product.gender,
        category: product.category,
        occasion: product.occasion
      };
      return Product.find(similarProductsQuery);
    })
    .then(similarProducts => {
      similarProducts = similarProducts.filter(prod => prod._id.toString() !== prodID.toString());
      return res.render('shop/product-detail', {
        product: fetchedProduct,
        similarProducts: similarProducts,
        pageTitle: `View Product | ${fetchedProduct.title}`,
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
        totalAmount: totalAmount,
        oldInput: {
          name: '',
          house: '',
          street: '',
          city: '',
          PIN: ''
        },
        errorMessage: null,
        validationErrors: []
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
  const { name, house, street, city, PIN } = req.body;
  const totalAmount = req.body.totalamount;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      return res.status(422).render('shop/cart', {
        pageTitle: 'GiftKart | Your Cart',
        path: '/cart',
        products: user.cart.items,
        totalAmount: totalAmount,
        oldInput: {
          name: name,
          house: house,
          street: street,
          city: city,
          PIN: PIN
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
  }

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
        orderDate: new Date(),
        address: {
          name: name,
          house: house,
          street: street,
          city: city,
          pin: PIN
        }
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
  let query = {} ;

  //code to handle ages
  if(req.body.maxage !== '0'){
    query["ages.max"] = req.body.maxage
  }
  if(req.body.minage !== '0'){
    query["ages.min"] = req.body.minage
  }
  
  // code to handle occasions
  if(req.body.occasion) {
    if(Array.isArray(req.body.occasion)) {
      query.occasion = [...req.body.occasion];
    } else {
      query.occasion =  req.body.occasion;
    } 
  }

  // code to handle price
  if(req.body.minprice && req.body.maxprice) {
    query.price = { $gt: req.body.minprice, $lt: req.body.maxprice};
  }
  else if(req.body.minprice) {
    query.price = { $gt: req.body.minprice};
  }
  else if(req.body.maxprice){
    query.price = { $lt: req.body.maxprice};
  }

  // code to handle gender
  if(req.body.gender){
    let queryGender = [req.body.gender, 'B'];
    query.gender = queryGender;
  }

  console.log('query', query);
	Product.find(query)
		.then(products => {
			return res.render("shop/recommend-products", {
				prods: products,
				pageTitle: "GiftKart | Recommended Products",
				path: "/recommend-products"
			});
		})
		.catch(err => console.log(err));
};

