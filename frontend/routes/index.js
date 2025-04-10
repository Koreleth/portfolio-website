var express = require('express');
var router = express.Router();
const axios = require('axios');

let indexController = require('../controllers/indexController');

/* GET home page. */
router.route("/")
.get(async(req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = await indexController.getIndex(req);
  console.log(response.data);
  console.log("CART SIZE:" + res.locals.cartSize);
  // Rendert die Startseite mit den beliebtesten Artikeln und dem Seitentitel
  res.render('index', { data: response.data, title: response.title });
})



module.exports = router;
