var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')

router.route("/:slug")
.get(async(req,res,next)=> {
  // Ruft die Kategorie samt ihrer Projekte ab
  let response = await portfolioController.getPortfolioByCategorie(req.params.slug);

  res.status(response.status).json(response.data);
})


module.exports = router;