const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  return res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errorMessage: null,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
}

exports.getSignup = (req, res, next) => {
  return res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: null,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({ email: email })
    .then(user => {
      if (user) {
        bcrypt.compare(password, user.password)
        .then(passwordMatch => {
          if (passwordMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              if (!err) {
                res.redirect('/');
              } else {
                console.log(err);
              }
            });
          } else {
            return res.status(422).render('auth/login', {
              path: '/login',
              pageTitle: 'Login',
              errorMessage: 'Invalid email or password',
              oldInput: {
                email: email,
                password: password
              },
              validationErrors: []
            });
          }
        })
        .catch(err => {
          console.log(err);
        })
      } else {
        return res.status(400).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'There is no user corresponding to this email',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
  })
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
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

  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(user => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save(err => {
        if (!err) {
          res.redirect('/');
        } else {
          console.log(err);
        }
      });
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
};