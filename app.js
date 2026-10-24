var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var crypto = require('crypto');
var logger = require('morgan');

// Zugangsdaten für den Admin-Bereich aus .env laden (wird nicht committet, Vorlage: .env.example)
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (err) {
  console.warn('Keine .env gefunden – der Admin-Login ist deaktiviert (Vorlage: .env.example).');
}

var indexRouter = require('./routes/index');
var portfolioRouter = require('./routes/portfolio');
var apiRouter = require('./routes/api');
var adminRouter = require('./routes/admin');

var app = express();

// Hinter einem Proxy mit HTTPS (z. B. beim Hoster) sonst keine sicheren Cookies
if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// SVG-Dateien (z. B. hochgeladene Tool-Icons) dürfen keine Skripte ausführen, auch nicht direkt geöffnet
app.use(function(req, res, next) {
  if (/\.svg$/i.test(req.path)) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Login-Cookie für den Admin-Bereich: signiert, nicht per JavaScript lesbar, 8 Stunden gültig
app.use(cookieSession({
  name: 'portfolio_admin',
  keys: [process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')],
  maxAge: 8 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  secure: app.get('env') === 'production'
}));

// In allen Templates verfügbar: ist der Admin eingeloggt?
app.use(function(req, res, next) {
  res.locals.isAdmin = Boolean(req.session && req.session.admin);
  next();
});


// JSON-Schnittstelle (früher das separate Backend)
app.use('/api', apiRouter);
// Admin-Bereich mit Login
app.use('/admin', adminRouter);
// Seiten: /portfolio → /portfolio/:kategorie → /portfolio/:kategorie/:projekt
app.use('/portfolio', portfolioRouter);
app.use('/', indexRouter);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.status = err.status || 500;

  // API-Anfragen bekommen JSON statt einer HTML-Seite
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(res.locals.status).json({ error: err.message });
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.title = res.locals.status === 404 ? 'Seite nicht gefunden' : 'Fehler';

  // render the error page
  res.status(res.locals.status);
  res.render('error');
});

module.exports = app;
