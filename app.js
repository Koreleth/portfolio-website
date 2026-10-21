var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var categorieRouter = require('./routes/categories');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// JSON-Schnittstelle (früher das separate Backend)
app.use('/api', apiRouter);
// Seiten
app.use('/categorie', categorieRouter);
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
