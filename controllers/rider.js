const bcrypt = require('bcrypt');
const Rider = require('../models/rider');
const Order = require('../models/order');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

exports.getRiderLogin = (req, res, next) => {
  return res.render('rider/rider-login', {
    pageTitle: 'GiftKart | Rider Login',
    path: '/rider/login',
    errorMessage: null,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getRiderSignup = (req, res, next) => {
  return res.render('rider/rider-signup', {
    path: '/rider/signup',
    pageTitle: 'GiftKart | Rider Signup',
    errorMessage: null,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postRiderLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const rider = await Rider.findOne({ email: email });

    if (rider) {
      const passwordMatch = await bcrypt.compare(password, rider.password);
      if (passwordMatch) {
        req.session.isLoggedIn = true;
        req.session.isRider = true;
        req.session.rider = rider;
        return req.session.save(err => {
          if (!err) {
            res.redirect('/rider/rider-portal');
          } else {
            console.log(err);
            return next(err);
          }
        });
      } else {
        throw new Error('Invalid rider email or password');
      }
    } else {
      throw new Error('User not found');
    }
  } catch (err) {
    return res.status(422).render('rider/rider-login', {
      pageTitle: 'GiftKart | Rider Login',
      path: '/rider/login',
      errorMessage: err,
      oldInput: {
        email: email,
        password: password
      }
    });
  }
};

exports.postRiderSignup = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('rider/rider-signup', {
      path: 'rider/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const rider = new Rider({ email: email, password: hashedPassword });

    await rider.save();

    req.session.isLoggedIn = true;
    req.session.rider = rider;
    req.session.isRider = true;

    await req.session.save();
    res.redirect('/rider/rider-portal');

    transporter.sendMail({
      to: email,
      from: 'admin@giftkart.com',
      subject: 'Welcome to GiftKart!',
      html: `
      <h2>You signed up successfully as a GiftKart Rider!</h2>
      <p>We are delighted to have you as our Rider!</p>
    `
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.getRiderPortal = async (req, res, next) => {
  try {
    const rider = await Rider.findOne({ _id: req.session.rider._id });
    const assignedOrders = await Order.find({ _id: { $in: rider.assignedOrders } });
    const completedOrders = await Order.find({ _id: { $in: rider.completedOrders } });

    return res.render('rider/rider-portal', {
      completedOrders: rider.completedOrders,
      assignedOrders: rider.assignedOrders,
      pageTitle: 'GiftKart | Rider portal',
      path: 'rider/rider-portal',
      assignedOrders: assignedOrders,
      completedOrders: completedOrders
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.getAssignedOrderDetails = async (req, res, next) => {
  let assignedOrderId = req.params.assignedOrderId;
  try {
    const order = await Order.findOne({ _id: assignedOrderId });
    const hereMapApiKey =  process.env.HEREMAPS_API_KEY;

    return res.render('rider/assigned-order-details', {
      pageTitle: 'GiftKart | Assigned Order Details',
      path: `rider/rider-portal/${assignedOrderId}`,
      order: order,
      hereMapApiKey: hereMapApiKey
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

exports.postRiderOrderStatus = async (req, res, next) => {
  let newOrderStatus = req.body.orderStatus;
  let assignedOrderId = req.body.orderId;

  try {
    let orderAssignedTo = null;
    const riders = await Rider.find();

    for (const rider of riders)
      for (const assignedOrder of rider.assignedOrders)
        if (assignedOrderId.toString() === assignedOrder.toString()) orderAssignedTo = rider;

    const rider = await Rider.findById(orderAssignedTo._id);
    const order = await Order.findById(assignedOrderId);

    //Changin rider Data
    const newCompletedOrders = [...rider.completedOrders];
    newCompletedOrders.push(assignedOrderId);
    rider.completedOrders = newCompletedOrders;
    let index = rider.assignedOrders.indexOf(assignedOrderId);
    if (index > -1) rider.assignedOrders.splice(index, 1);

    //Changin order Data
    order.status = newOrderStatus;

    await order.save();
    await rider.save();

    return res.redirect(`/rider/rider-portal/${assignedOrderId}`);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
