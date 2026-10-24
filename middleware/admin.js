var createError = require('http-errors');

// Nur eingeloggt weiter, sonst zum Login
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
};

// Formulare nur von der eigenen Seite annehmen (zusätzlich zum SameSite-Cookie gegen CSRF)
const sameOrigin = (req, res, next) => {
  const source = req.get('origin') || req.get('referer');
  if (source) {
    try {
      if (new URL(source).host !== req.get('host')) {
        return next(createError(403));
      }
    } catch (err) {
      return next(createError(403));
    }
  }
  next();
};

module.exports = {
  requireAdmin,
  sameOrigin
}
