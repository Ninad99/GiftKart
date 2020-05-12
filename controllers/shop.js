const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const Product = require('../models/product');
const Order = require('../models/order');

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

exports.getIndex = (req, res, next) => {
  return res.render('shop/index', {
    pageTitle: 'GiftKart | Home',
    path: '/'
  });
};

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
};

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
      similarProducts = similarProducts.filter(
        prod => prod._id.toString() !== prodID.toString()
      );
      return res.render('shop/product-detail', {
        product: fetchedProduct,
        similarProducts: similarProducts,
        pageTitle: `View Product | ${fetchedProduct.title}`,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

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
        return curr.quantity * curr.productId.price + acc;
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
};

exports.postCart = (req, res, next) => {
  const prodID = req.body.productId;
  const redirectTo = req.body.redirect;

  Product.findById(prodID)
    .then(product => {
      if(product.quantity > 0){
        product.quantity = product.quantity - 1;
      }
      return product.save()
    })
    .then(result => {
      return req.user.addToCart(result);
    })
    .then(result => {
      if (redirectTo) {
        return res.redirect(redirectTo);
      }
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  const { name, house, street, city, PIN } = req.body;
  const totalAmount = req.body.totalamount;
  const email = req.user.email;
  let orderId, orderItems;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
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
      });
  } else {
    req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(user => {
        const products = user.cart.items.map(item => {
          return {
            quantity: item.quantity,
            productData: { ...item.productId._doc }
          };
        });
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
            pin: parseInt(PIN)
          }
        });
        orderItems = products;
        return order.save();
      })
      .then(result => {
        orderId = result._id.toString();
        return req.user.clearCart();
      })
      .then(() => {
        res.redirect('/orders');
        let listItems = ``;
        orderItems.forEach(product => {
          listItems += `<li>${product.productData.title} (${product.quantity})</li>`;
        });
        transporter.sendMail({
          to: email,
          from: 'admin@giftkart.com',
          subject: 'Order placed successfully!',
          html: `
          <h2>Hello ${name}!</h2>
          <h4>Your order has been placed successfully!</h4>
          <p>The order ID is ${orderId}.</p>
          <p>The items in your order are:</p>
          <ul>
          ${listItems}
          </ul>
          `
        });
      })
      .catch(err => {
        console.log(err);
        return next(err);
      });
  }
};

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
    });
};

exports.postProducts = (req, res, next) => {
  let query = {};

  //code to handle ages
  if (req.body.maxage !== '0') {
    query['ages.max'] = req.body.maxage;
  }
  if (req.body.minage !== '0') {
    query['ages.min'] = req.body.minage;
  }

  // code to handle occasions
  if (req.body.occasion) {
    if (Array.isArray(req.body.occasion)) {
      query.occasion = [...req.body.occasion];
    } else {
      query.occasion = req.body.occasion;
    }
  }

  // code to handle price
  if (req.body.minprice && req.body.maxprice) {
    query.price = { $gt: req.body.minprice, $lt: req.body.maxprice };
  } else if (req.body.minprice) {
    query.price = { $gt: req.body.minprice };
  } else if (req.body.maxprice) {
    query.price = { $lt: req.body.maxprice };
  }

  // code to handle gender
  if (req.body.gender) {
    let queryGender = [req.body.gender, 'B'];
    query.gender = queryGender;
  }

  Product.find(query)
    .then(products => {
      return res.render('shop/product-list', {
        prods: products,
        pageTitle: 'GiftKart | Products',
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.autocomplete = (req, res, next) => {
  let regex = new RegExp(req.query['term'], 'i');

  Product.find({ title: { $regex: regex } })
    .sort({ updated_at: -1 })
    .sort({ created_at: -1 })
    .limit(20)
    .exec((err, data) => {
      let result = [];
      if (!err) {
        if (data && data.length && data.length > 0) {
          data.forEach(products => {
            let obj = {
              id: products._id,
              label: products.title
            };
            result.push(obj);
          });
        }
        res.jsonp(result);
      }
    });
};

exports.searchProducts = (req, res, next) => {
  let regex = new RegExp(req.body.query, 'i');

  Product.find({ title: { $regex: regex } })
    .then(products => {
      return res.render('shop/product-list', {
        prods: products,
        pageTitle: 'GiftKart | All Products',
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getRecommendProductIndex = (req, res, next) => {
  const category = req.query.category || null;

  if (!category) {
    return res.redirect('/products');
  }

  let query = {};

  if (category === 'men' || category === 'women' || category === 'kids') {
    query['gender'] = [category, 'B'];
  }

  if (
    category === 'birthday' ||
    category === 'marriage' ||
    category === 'other'
  ) {
    query['occasion'] = category;
  }

  Product.find(query)
    .then(products => {
      return res.render('shop/recommend-product-index', {
        pageTitle: 'GiftKart | Recommend Product',
        path: '/recommend-products',
        category: category,
        prods: products
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    });
};
