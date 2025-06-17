var express = require('express');
var router = express.Router();
const axios = require('axios');

let portfolioController = require('../controllers/portfolioController');

/* GET categorie Page. */
router.route('/:id')
.get(async(req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = await portfolioController.getPortolios(req.params.id);
  // Rendert die Startseite mit den beliebtesten Artikeln und dem Seitentitel
  res.render('categories/categorie', {data: response.data ,title: 'Categorie1'});
})

router.route('/:idcat/:idport')
.get(async(req,res,next)=> {
  // Ruft die Daten für die Startseite vom Index-Controller ab
  let response = await portfolioController.getSinglePort(req.params.id);
  // Rendert die Startseite mit den beliebtesten Artikeln und dem Seitentitel
  res.render('categories/portolio', {data: response.data ,title: 'Portolio'});
})

module.exports = router;