module.exports = (req, res, next) => {
  if (!req.session.isRider) {
    return res.status(401).redirect('/rider/login');
  }
  next();
};
