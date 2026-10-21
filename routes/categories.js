var express = require('express');
var router = express.Router();
var createError = require('http-errors');

let portfolioController = require('../controllers/portfolioController');

/* GET categorie Page. */
router.route('/:slug')
.get((req,res,next)=> {
  // Kategorie samt ihrer Projekte
  let response = portfolioController.getPortfolioByCategorie(req.params.slug);
  if (response.status === 404) {
    return next(createError(404));
  }
  res.render('categories/categorie', {data: response.data, title: response.data.categorie.name});
})
router.route('/:catSlug/:slug')
.get((req,res,next)=> {
  // Einzelnes Projekt innerhalb seiner Kategorie
  let response = portfolioController.getSinglePortfolio(req.params.catSlug, req.params.slug);
  if (response.status === 404) {
    return next(createError(404));
  }
  res.render('portfolio/portfoliowork', {data: response.data, title: response.data.title});
})

module.exports = router;
