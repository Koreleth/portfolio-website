var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var { rateLimit } = require('express-rate-limit');

let portfolioController = require('../../controllers/portfolioController');
let categorieController = require('../../controllers/categorieController');
let toolController = require('../../controllers/toolController');
let aboutController = require('../../controllers/aboutController');
let personaldataController = require('../../controllers/personaldataController');
let { requireAdmin, sameOrigin } = require('../../middleware/admin');

// Höchstens 10 fehlgeschlagene Login-Versuche pro 15 Minuten
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('admin/login', { title: 'Admin-Login', username: '', error: 'Zu viele Versuche. Bitte warte 15 Minuten.' });
  }
});

/* ---------- Login / Logout ---------- */

router.route('/login')
.get((req,res,next)=> {
  if (req.session.admin) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Admin-Login', username: '', error: null });
})
.post(sameOrigin, loginLimiter, async(req,res,next)=> {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!hash) {
    return res.status(503).render('admin/login', { title: 'Admin-Login', username, error: 'Der Admin-Login ist noch nicht eingerichtet: ADMIN_PASSWORD_HASH fehlt in der .env.' });
  }

  try {
    // Passwort immer prüfen (auch bei falschem Namen), damit die Antwortzeit nichts verrät
    const passwordOk = await bcrypt.compare(password, hash);
    if (!passwordOk || username !== (process.env.ADMIN_USER || 'admin')) {
      return res.status(401).render('admin/login', { title: 'Admin-Login', username, error: 'Benutzername oder Passwort ist falsch.' });
    }
    req.session.admin = true;
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.route('/logout')
.post(sameOrigin, (req,res,next)=> {
  req.session = null;
  res.redirect('/');
});

/* ---------- Ab hier nur mit Login ---------- */

router.use(requireAdmin);

/* GET /admin – Übersicht: Projekte, Kategorien, Tools, Über mich */
router.route('/')
.get((req,res,next)=> {
  res.render('admin/dashboard', {
    title: 'Admin',
    portfolios: portfolioController.getPortfoliosForAdmin().data,
    categories: categorieController.getCategoriesForAdmin().data,
    tools: toolController.getToolsForAdmin().data,
    about: aboutController.getAboutData().data,
    lifeline: personaldataController.getLifeline().data,
    notice: req.query.hinweis || null
  });
})

router.use('/projekte', require('./projekte'));
router.use('/kategorien', require('./kategorien'));
router.use('/tools', require('./tools'));
router.use('/ueber-mich', require('./ueber-mich'));

module.exports = router;
