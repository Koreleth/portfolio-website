var express = require('express');
var router = express.Router();
var portfolioController = require('./portfolioController');
var categorieController = require('./categorieController');
var axios = require('axios');


/**
 * Holt die Index-Daten für die Startseite.
 * @param {Object} req - Das Anfrageobjekt.
 * @returns {Object} - Die Antwort mit Status und Daten.
 */
const getIndex = async (req) => {

    // Holt die Equipment-Daten vom Equipment-Controller
    let response = await categorieController.getAllCategories(req);

    return { "status": 200, data: response.data , title: "Home"};
}

module.exports = {
    getIndex
}
