var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')
let categorieController = require('../controllers/categorieController')

/* GET home page. */
router.route("/portfolio")
.get((req,res,next)=> {
  let response = portfolioController.getPortfolioData();
  res.status(response.status).json(response.data);
})

router
.route("/categories")
.get((req,res,next)=> {
  let response = categorieController.getCategorieData();
  res.status(response.status).json(response.data);
})



module.exports = router;
