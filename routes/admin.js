var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var createError = require('http-errors');
var bcrypt = require('bcryptjs');
var multer = require('multer');
var { rateLimit } = require('express-rate-limit');

let portfolioController = require('../controllers/portfolioController');
let categorieController = require('../controllers/categorieController');
let toolController = require('../controllers/toolController');

/* ---------- Schutz ---------- */

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

/* ---------- Bild-Upload ---------- */

// Projektbilder: nur JPG, PNG, WebP oder GIF (kein SVG), höchstens 5 MB
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'img', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = portfolioController.slugify(path.basename(file.originalname, ext)) || 'bild';
      cb(null, Date.now() + '-' + name + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file.originalname).toLowerCase())
      && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(allowed ? null : new Error('Bitte nur JPG, PNG, WebP oder GIF hochladen.'), allowed);
  }
});

// Upload-Fehler nicht als Serverfehler behandeln, sondern im Formular anzeigen
const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'Das Bild ist größer als 5 MB.' : err.message;
    }
    next();
  });
};

// Hochgeladenes Bild wieder entfernen, wenn das Projekt nicht gespeichert wird
const removeUpload = (req) => {
  if (req.file) {
    fs.unlink(req.file.path, () => {});
  }
};

/* ---------- Formular ---------- */

// Formulardaten so, wie sie im Formular wieder angezeigt werden
const formProject = (req) => ({
  title: req.body.title,
  slug: req.body.slug,
  categoryID: parseInt(req.body.categoryID),
  description: req.body.description,
  text: req.body.text,
  tools: [].concat(req.body.tools || [])
});

const renderForm = (res, options) => {
  res.render('admin/project-form', {
    title: options.isNew ? 'Neues Projekt' : 'Projekt bearbeiten',
    categories: categorieController.getCategorieData().data,
    tools: toolController.getToolData().data,
    error: null,
    ...options
  });
};

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

/* GET /admin – Übersicht aller Projekte */
router.route('/')
.get((req,res,next)=> {
  res.render('admin/dashboard', {
    title: 'Admin',
    categories: categorieController.getCategorieData().data,
    portfolios: portfolioController.getPortfoliosForAdmin().data,
    notice: req.query.hinweis || null
  });
})

/* Neues Projekt */
router.route('/projekte/neu')
.get((req,res,next)=> {
  renderForm(res, { isNew: true, project: { tools: [] } });
})

router.route('/projekte')
.post(sameOrigin, uploadImage, (req,res,next)=> {
  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : portfolioController.createPortfolio({ ...req.body, image: req.file ? '/img/uploads/' + req.file.filename : null });

  if (result.status !== 201) {
    removeUpload(req);
    return renderForm(res.status(result.status), { isNew: true, project: formProject(req), error: result.data });
  }
  res.redirect('/admin?hinweis=gespeichert');
})

/* Projekt bearbeiten */
router.route('/projekte/:id/bearbeiten')
.get((req,res,next)=> {
  const response = portfolioController.getPortfolioById(req.params.id);
  if (response.status === 404) {
    return next(createError(404));
  }
  renderForm(res, { isNew: false, project: response.data });
})

router.route('/projekte/:id')
.post(sameOrigin, uploadImage, (req,res,next)=> {
  const current = portfolioController.getPortfolioById(req.params.id);
  if (current.status === 404) {
    removeUpload(req);
    return next(createError(404));
  }

  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : portfolioController.updatePortfolio(req.params.id, { ...req.body, image: req.file ? '/img/uploads/' + req.file.filename : null });

  if (result.status !== 200) {
    removeUpload(req);
    return renderForm(res.status(result.status), { isNew: false, project: { ...current.data, ...formProject(req) }, error: result.data });
  }
  res.redirect('/admin?hinweis=gespeichert');
})

/* Projekt löschen */
router.route('/projekte/:id/loeschen')
.post(sameOrigin, (req,res,next)=> {
  const result = portfolioController.deletePortfolio(req.params.id);
  if (result.status === 404) {
    return next(createError(404));
  }
  res.redirect('/admin?hinweis=geloescht');
})

module.exports = router;
