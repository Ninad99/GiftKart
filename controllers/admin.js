const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const Admin = require('../models/admin');
const Product = require('../models/product');
const Order = require('../models/order');
const Rider = require('../models/rider');

exports.getUploadProduct = (req, res, next) => {
  return res.render('admin/add-product', {
    pageTitle: 'GiftKart Admin | Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    message: null,
    oldInput: {
      title: '',
      price: '',
      description: '',
      imageUrl: '',
      category: '',
      quantity: '',
      ages: {
        min: '',
        max: ''
      },
      gender: '',
      occasion: ''
    },
    validationErrors: []
  });
};

exports.postUploadProduct = async (req, res, next) => {
  const errors = validationResult(req);

  let occasionArr = [];
  let categoryArr = [];

  if (req.body.occasion) {
    if (req.body.occasion.length > 1) occasionArr = req.body.occasion;
    else occasionArr.push(req.body.occasion);
  }

  if (req.body.category) {
    if (req.body.category.length > 1) categoryArr = req.body.category;
    else categoryArr.push(req.body.category);
  }

  const newProduct = {
    title: req.body.title,
    price: parseInt(req.body.price),
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    category: categoryArr,
    quantity: parseInt(req.body.quantity),
    ages: {
      min: parseInt(req.body.minage),
      max: parseInt(req.body.maxage)
    },
    gender: req.body.gender,
    occasion: occasionArr
  };

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-product', {
      pageTitle: 'GiftKart Admin | Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      message: errors.array()[0].msg,
      oldInput: newProduct,
      validationErrors: errors.array()
    });
  }

  try {
    const product = await new Product(newProduct);
    await product.save();

    return res.render('admin/add-product', {
      pageTitle: 'GiftKart Admin | Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: false,
      message: 'Successfully added product!',
      oldInput: {
        title: '',
        price: '',
        imageUrl: '',
        description: '',
        category: '',
        quantity: '',
        ages: {
          min: '',
          max: ''
        },
        gender: '',
        occasion: ''
      },
      validationErrors: []
    });
  } catch (err) {
    return res.render('admin/add-product', {
      pageTitle: 'GiftKart Admin | Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      message:
        'There was an error while saving the product. Check your network connection and retry.',
      oldInput: newProduct,
      validationErrors: []
    });
  }
};

exports.getAdminLogin = (req, res, next) => {
  return res.render('admin/admin-login', {
    pageTitle: 'Admin Login',
    path: '/admin/login',
    errorMessage: null,
    oldInput: {
      email: '',
      password: ''
    }
  });
};

exports.postAdminLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const admin = await Admin.findOne({ email: email });

    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);

      if (passwordMatch) {
        req.session.isLoggedIn = true;
        req.session.isAdmin = true;
        req.session.user = admin;
        return req.session.save(err => {
          if (!err) {
            res.redirect('/admin/add-product');
          } else {
            console.log(err);
          }
        });
      } else {
        throw new Error('Invalid admin email or password');
      }
    } else {
      throw new Error('Invalid admin email or password');
    }
  } catch (err) {
    return res.status(422).render('admin/admin-login', {
      pageTitle: 'Admin Login',
      path: '/admin/login',
      errorMessage: err,
      oldInput: {
        email: email,
        password: password
      }
    });
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();

    return res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;

  try {
    const result = await Product.deleteOne({ _id: prodId });
    return res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.getEditProduct = async (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.redirect('/');
    }
    return res.render('admin/add-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      hasError: false,
      message: null,
      oldInput: product,
      validationErrors: []
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const errors = validationResult(req);

  const updatedProduct = {
    title: req.body.title,
    price: parseInt(req.body.price),
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    category: req.body.category,
    quantity: parseInt(req.body.quantity),
    ages: {
      min: parseInt(req.body.minage),
      max: parseInt(req.body.maxage)
    },
    gender: req.body.gender,
    occasion: req.body.occasion
  };

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      oldInput: {
        ...updatedProduct,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  try {
    const product = await Product.findById(prodId);
    product.title = updatedProduct.title;
    product.price = updatedProduct.price;
    product.description = updatedProduct.description;
    product.imageUrl = updatedProduct.imageUrl;
    product.category = updatedProduct.category;
    product.quantity = updatedProduct.quantity;
    product['ages.min'] = updatedProduct.ages.min;
    product['ages.max'] = updatedProduct.ages.max;
    product.gender = updatedProduct.gender;
    product.occasion = updatedProduct.occasion;

    const result = await product.save();
    console.log('updated product', result);
    return res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();
    return res.render('admin/orders', {
      pageTitle: 'View Orders | Admin',
      path: '/admin/orders',
      orders: orders
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.postAdminOrderStatus = async (req, res, next) => {
  const { orderId, orderStatus } = req.body;

  try {
    const order = await Order.findById(orderId);
    order.status = orderStatus;
    await order.save();

    return res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    const riders = await Rider.find();

    let orderAssignedTo = null;

    for (const rider of riders) {
      for (const assignedOrder of rider.assignedOrders) {
        if (req.params.orderId.toString() === assignedOrder.toString()) {
          orderAssignedTo = rider;
        }
      }
    }

    return res.render('admin/order-details', {
      pageTitle: 'View Orders | Admin',
      path: '/admin/orders',
      order: order,
      riders: riders,
      orderAssignedTo: orderAssignedTo
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.assignOrderToRider = async (req, res, next) => {
  const orderId = req.body.orderId;
  const riderId = req.body.riderId;

  try {
    const order = await Order.findById(orderId);
    const rider = await Rider.findById(riderId);

    const newAssignedOrders = [...rider.assignedOrders];
    newAssignedOrders.push(orderId);
    rider.assignedOrders = newAssignedOrders;

    order.status = 'transit';

    await order.save();
    await rider.save();

    return res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
