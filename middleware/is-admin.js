module.exports = (req, res, next) => {
  if (!req.session.isAdmin) {
    return res.status(401).redirect('/admin/login');
  }
  next();
}