var express = require('express');
var router = express.Router();

let indexController = require('../controllers/indexController');

/* GET home page. */
router.route("/")
.get(async(req,res,next)=> {
  try {
    // Ruft die Daten für die Startseite vom Index-Controller ab
    let response = await indexController.getIndex(req);

    console.log(response.data);
    // Rendert die Startseite mit den beliebtesten Artikeln und dem Seitentitel
    res.render('index', { data: response.data, title: response.title });
  } catch (err) {
    // z. B. wenn das Backend nicht erreichbar ist
    next(err);
  }
})


module.exports = router;
