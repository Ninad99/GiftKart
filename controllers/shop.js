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
      let SimilarProductsQuery = {};

      SimilarProductsQuery.gender = product.gender;
      SimilarProductsQuery.category = product.category;
      SimilarProductsQuery.occasion = product.occasion;

      Product.find(SimilarProductsQuery)
        .then(similarProducts => {
        for(let i in similarProducts){
          // if(similarProducts[i]._id !== product._id){ // this line does't work thefuck ?
          if(similarProducts[i].id === product.id){
            similarProducts.splice(i);
          }
        }
        return res.render('shop/product-detail', {
          product: product,
          similarProducts: similarProducts,
          pageTitle: `View Product | ${product.title}`,
          path: '/products'
        });
      })
      .catch(err => console.log(err));
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
  let query;

  // code to handle ages
  if(req.body.minage !== '0'){
    if(req.body.maxage !== '0'){
      query = {
        'ages.min' : req.body.minage,
        'ages.max' : req.body.maxage
      }
    }else{
      query = {
        'ages.min' : req.body.minage
      }
    }
  }else{
    query = {};
  }

  // code to handle occasions
  if(req.body.occasion) {
    if(Array.isArray(req.body.occasion)) {
      let QueryOccasions = [];
      for(let i in req.body.occasion) {
        QueryOccasions.push(req.body.occasion[i]);
      }
      query.occasion = QueryOccasions;
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

