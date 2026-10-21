var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('./config');

var indexRouter = require('./routes/index');
var categorieRouter = require('./routes/categories');
var portfolioRouter = require('./routes/portfoliowork');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// In allen Templates verfügbar, z. B. für Bild-URLs vom Backend
app.locals.backendUrl = config.backendUrl;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/categorie', categorieRouter);
app.use('/', indexRouter);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.status = err.status || 500;
  res.locals.title = res.locals.status === 404 ? 'Seite nicht gefunden' : 'Fehler';

  // render the error page
  res.status(res.locals.status);
  res.render('error');
});

module.exports = app;
