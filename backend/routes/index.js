var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')
let categorieController = require('../controllers/categorieController')
let lifelineController = require('../controllers/personaldataController')

/* GET home page. */
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
  let response = lifelineController.getLifeline(req);
  res.status(response.status).json(response.data);
})




module.exports = router;
