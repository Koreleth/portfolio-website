var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')

router.route("/:catSlug/:slug")
.get(async(req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = await portfolioController.getSinglePortfolio(req.params.slug);

  res.status(response.status).json(response.data);
})


module.exports = router;