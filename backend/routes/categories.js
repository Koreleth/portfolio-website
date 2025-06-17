var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')

router.route("/:id")
.get(async(req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = await portfolioController.getPortfolioByCategorie(req.params.id);

  res.status(response.status).json(response.data);
})


module.exports = router;