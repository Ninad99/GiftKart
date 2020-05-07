const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/user');

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

exports.getLogin = (req, res, next) => {
  const redirectUrl = req.query.redirect;

  return res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errorMessage: null,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: [],
    redirectUrl: redirectUrl
  });
};

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
  const redirectUrl = req.body.redirect;
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
      validationErrors: errors.array(),
      redirectUrl: redirectUrl
    });
  }
  User.findOne({ email: email }).then(user => {
    if (user) {
      bcrypt
        .compare(password, user.password)
        .then(passwordMatch => {
          if (passwordMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              if (!err) {
                if (redirectUrl) {
                  return res.redirect(redirectUrl);
                }
                res.redirect('/products');
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
              validationErrors: [],
              redirectUrl: redirectUrl
            });
          }
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      return res.status(400).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'There is no user corresponding to this email',
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: [],
        redirectUrl: redirectUrl
      });
    }
  });
};

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

  bcrypt
    .hash(password, 12)
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
          res.redirect('/products');
        } else {
          console.log(err);
        }
      });
    })
    .then(result => {
      return transporter.sendMail({
        to: email,
        from: 'admin@giftkart.com',
        subject: 'Welcome to GiftKart!',
        html: `
          <h2>You signed up successfully!</h2>
          <p>We are delighted to have you as our user!</p>  
        `
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

exports.getReset = (req, res, next) => {
  res.render('auth/reset-password', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: null,
    userMessage: null
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          return res.render('auth/reset-password', {
            path: '/reset',
            pageTitle: 'Reset Password',
            errorMessage: `There is no account corresponding to ${email}!`,
            userMessage: null
          });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.render('auth/reset-password', {
          path: '/reset',
          pageTitle: 'Reset Password',
          errorMessage: null,
          userMessage: 'A password reset link has been sent to the given email.'
        });
        transporter.sendMail({
          to: email,
          from: 'admin@giftkart.com',
          subject: 'Password reset',
          html: `
            <h2>Hello GIftKart User!</h2>
            <h4>You requested a password reset for ${email}</h4>
            <p>Click this <a href="https://giftkart.herokuapp.com/reset/${token}">link</a> to set a new password.</p>
            <p><em>If this request wasn't made by you then you can safely ignore this email.</em></p>
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        return res.render('auth/new-password', {
          path: '/new-password',
          pageTitle: 'Set a new password',
          errorMessage: 'Your reset token may have expired.',
          userId: user._id.toString(),
          passwordToken: token
        });
      } else {
        return res.render('auth/new-password', {
          path: '/new-password',
          pageTitle: 'Set a new password',
          errorMessage: null,
          userId: user._id.toString(),
          passwordToken: token
        });
      }
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'Set a new password',
      errorMessage: errors.array()[0].msg,
      userId: user._id.toString(),
      passwordToken: passwordToken
    });
  }

  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
