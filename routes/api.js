var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')
let categorieController = require('../controllers/categorieController')
let lifelineController = require('../controllers/personaldataController')

// JSON-Schnittstelle unter /api – gleiche Hierarchie wie die Seiten unter /portfolio

router.route("/portfolio")
.get((req,res,next)=> {
  // Alle Kategorien
  let response = categorieController.getCategorieData();
  res.status(response.status).json(response.data);
})

router.route("/portfolio/:catSlug")
.get((req,res,next)=> {
  // Kategorie samt ihrer Projekte
  let response = portfolioController.getPortfolioByCategorie(req.params.catSlug);
  res.status(response.status).json(response.data);
})

router.route("/portfolio/:catSlug/:slug")
.get((req,res,next)=> {
  // Einzelnes Projekt innerhalb seiner Kategorie
  let response = portfolioController.getSinglePortfolio(req.params.catSlug, req.params.slug);
  res.status(response.status).json(response.data);
})

router.route("/lifeline")
.get((req,res,next)=> {
  let response = lifelineController.getLifeline();
  res.status(response.status).json(response.data);
})


module.exports = router;
