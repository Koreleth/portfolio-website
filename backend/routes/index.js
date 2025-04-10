var express = require('express');
var router = express.Router();

let portfolioController = require('../controllers/portfolioController')

/* GET home page. */
router.route("/portfolio")
.get((req,res,next)=> {
  let response = portfolioController.getAllPortfolios();
  res.status(response.status).json(response.data);
})



module.exports = router;
