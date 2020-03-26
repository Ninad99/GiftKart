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
