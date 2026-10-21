var express = require('express');
var router = express.Router();

let indexController = require('../controllers/indexController');

/* GET home page. */
router.route("/")
.get((req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = indexController.getIndex();

  // Rendert die Startseite mit Kategorien, Lebenslauf und Seitentitel
  res.render('index', { data: response.data, title: response.title });
})


module.exports = router;
