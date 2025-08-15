var express = require('express');
var router = express.Router();
const axios = require('axios');

let portfolioController = require('../controllers/portfolioController');

/* GET categorie Page. */
router.route(':catSlug/:slug')
.get(async(req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = await portfolioController.getSinglePortfolio(req.params.catSlug, req.params.slug);
  // Rendert die Startseite mit den beliebtesten Artikeln und dem Seitentitel
  res.render('portfolio/portfoliowork', {data: response.data ,title: req.params.slug});
})


module.exports = router;