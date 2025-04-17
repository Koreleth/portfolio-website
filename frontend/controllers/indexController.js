var express = require('express');
var router = express.Router();
var lifelineController = require('./lifelinecontroller');
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
    let response = {
        categories: await categorieController.getAllCategories(req),
        lifeline: await lifelineController.getLifeline(req)
    }
    

    return { "status": 200, data: {categories: response.categories.data, lifeline: response.lifeline.data} , title: "Home"};
}

module.exports = {
    getIndex
}
