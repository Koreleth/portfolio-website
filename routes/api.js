var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')
let categorieController = require('../controllers/categorieController')
let lifelineController = require('../controllers/personaldataController')

// JSON-Schnittstelle unter /api (früher das separate Backend), z. B. für den späteren Admin-Bereich

router.route("/portfolio")
.get((req,res,next)=> {
  let response = portfolioController.getPortfolioData();
  res.status(response.status).json(response.data);
})

router.route("/categories")
.get((req,res,next)=> {
  let response = categorieController.getCategorieData();
  res.status(response.status).json(response.data);
})

router.route("/lifeline")
.get((req,res,next)=> {
  let response = lifelineController.getLifeline();
  res.status(response.status).json(response.data);
})

router.route("/categorie/:slug")
.get((req,res,next)=> {
  // Kategorie samt ihrer Projekte
  let response = portfolioController.getPortfolioByCategorie(req.params.slug);
  res.status(response.status).json(response.data);
})

router.route("/portfoliowork/:catSlug/:slug")
.get((req,res,next)=> {
  // Einzelnes Projekt innerhalb seiner Kategorie
  let response = portfolioController.getSinglePortfolio(req.params.catSlug, req.params.slug);
  res.status(response.status).json(response.data);
})


module.exports = router;
