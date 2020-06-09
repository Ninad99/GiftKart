const bcrypt = require('bcrypt');
const Rider = require('../models/rider');

exports.getRiderLogin = (req, res, next) => {
  return res.render('rider/rider-login', {
    pageTitle: 'GiftKart | Rider Login',
    path: '/rider/login',
    errorMessage: null,
    oldInput: {
      email: '',
      password: ''
    }
  });
};

exports.postRiderLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const rider = await Rider.findOne({ email: email });

    if (rider) {
      const passwordMatch = bcrypt.compare(password, rider.password);
      if (passwordMatch) {
        req.session.isLoggedIn = true;
        req.session.isRider = true;
        req.session.user = rider;
        return req.session.save(err => {
          if (!err) {
            res.redirect('/rider/view-orders');
          } else {
            console.log(err);
            return next(err);
          }
        });
      } else {
        return res.status(422).render('rider/rider-login', {
          pageTitle: 'GiftKart | Rider Login',
          path: '/rider/login',
          errorMessage: 'Invalid rider email or password',
          oldInput: {
            email: email,
            password: password
          }
        });
      }
    }
  } catch (err) {
    return res.status(400).render('rider/rider-login', {
      pageTitle: 'GiftKart | Rider Login',
      path: '/rider/login',
      errorMessage: 'Invalid rider email or password',
      oldInput: {
        email: email,
        password: password
      }
    });
  }
};
