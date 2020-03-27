const bcrypt = require('bcrypt');
const Admin = require('../models/admin');

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
}

exports.postAdminLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  Admin.findOne({ email: email })
    .then(admin => {
      if (admin) {
        bcrypt.compare(password, admin.password)
        .then(passwordMatch => {
          if (passwordMatch) {
            req.session.isLoggedIn = true;
            req.session.isAdmin = true;
            req.session.user = admin;
            return req.session.save(err => {
              if (!err) {
                res.redirect('/');
              } else {
                console.log(err);
              }
            });
          } else {
            return res.status(422).render('admin/admin-login', {
              pageTitle: 'Admin Login',
              path: '/admin/login',
              errorMessage: 'Invalid admin email or password',
              oldInput: {
                email: email,
                password: password
              }
            });
          }
        })
        .catch(err => {
          console.log(err);
        })
      }
  })
}