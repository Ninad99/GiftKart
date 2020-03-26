const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000;
require('dotenv').config();

const DATABASE_URI = process.env.MONGODB_URI;
const app = express();
const mongoose = require('mongoose');
const errorController = require('./controllers/error');

app.set('view engine', 'ejs');
app.set('views', 'views');

// TODO --> add routes and uncomment the following
// const adminRoutes = require('./routes/admin');
// const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.isAuthenticated = false;
  next();
});

// Uncomment above routes before add the following
// app.use('/admin', adminRoutes);
// app.use(authRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoose.connect(DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(result => {
  console.log('Connected to database successfully!');
  app.listen(port, () => console.log('server started...'));
}).catch(err => console.log(err));