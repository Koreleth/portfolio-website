var express = require('express');
var router = express.Router();
var createError = require('http-errors');

let portfolioController = require('../controllers/portfolioController');
let categorieController = require('../controllers/categorieController');

/* GET /portfolio – alle Kategorien */
router.route('/')
.get((req,res,next)=> {
  let response = categorieController.getCategorieData();
  res.render('portfolio/index', {data: response.data, title: 'Portfolio', activeNav: 'portfolio'});
})

/* GET /portfolio/:catSlug – Projekte einer Kategorie */
router.route('/:catSlug')
.get((req,res,next)=> {
  let response = portfolioController.getPortfolioByCategorie(req.params.catSlug);
  if (response.status === 404) {
    return next(createError(404));
  }
  res.render('portfolio/categorie', {data: response.data, title: response.data.categorie.name, activeNav: 'portfolio'});
})

/* GET /portfolio/:catSlug/:slug – einzelnes Projekt innerhalb seiner Kategorie */
router.route('/:catSlug/:slug')
.get((req,res,next)=> {
  let response = portfolioController.getSinglePortfolio(req.params.catSlug, req.params.slug);
  if (response.status === 404) {
    return next(createError(404));
  }
  res.render('portfolio/portfoliowork', {data: response.data, title: response.data.title, activeNav: 'portfolio'});
})

module.exports = router;
