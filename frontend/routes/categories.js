var express = require('express');
var router = express.Router();
var createError = require('http-errors');

let portfolioController = require('../controllers/portfolioController');

// Ein 404 vom Backend wird zur 404-Seite, alle anderen Fehler gehen an den Error-Handler
const forwardError = (err, next) => {
  if (err.response && err.response.status === 404) {
    return next(createError(404));
  }
  next(err);
};

/* GET categorie Page. */
router.route('/:slug')
.get(async(req,res,next)=> {
  try {
    // Ruft die Kategorie samt ihrer Projekte vom Backend ab
    let response = await portfolioController.getPortolios(req.params.slug);
    res.render('categories/categorie', {data: response.data, title: response.data.categorie.name});
  } catch (err) {
    forwardError(err, next);
  }
})
router.route('/:catSlug/:slug')
.get(async(req,res,next)=> {
  try {
    // Ruft ein einzelnes Projekt der Kategorie vom Backend ab
    let response = await portfolioController.getSinglePortfolio(req.params.catSlug, req.params.slug);
    res.render('portfolio/portfoliowork', {data: response.data, title: response.data.title});
  } catch (err) {
    forwardError(err, next);
  }
})

module.exports = router;
