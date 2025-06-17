var express = require('express');
var router = express.Router();
var axios = require('axios');



/**
 * Holt alle Portfolio Daten vom Backend und fügt Bearbeitungsrechte für Administratoren hinzu.
 * @param {Object} req - Das Anfrageobjekt.
 * @returns {Object} - Die Antwort des Backend-Servers.
 */
const getAllPortfolioData = async (req) => {
    let response = await axios.get('http://localhost:3000/portfolio');
    //response.auth = false;
    // Wenn der Benutzer eingeloggt und Administrator ist, werden Bearbeitungsrechte hinzugefügt
    /*if (utils.auth(req)) {
        response.data.forEach(element => {
            element.edit = true;
        });
        response.auth = true;
    }*/
    console.log(response.data);
    // Filtert die Equipment-Daten basierend auf einer Suchanfrage
    if (req.query.search) {
        search = req.query.search;
        console.log("Search: " + search);
        const filteredData = response.data.filter(equipment => equipment.title.toLowerCase().includes(search.toLowerCase()));
        response.data = filteredData;
        console.log(response.data);
    }

    return response;
};

const getPortolios = async (id) => {
    console.log("ID: " + id);
    let response = await axios.get('http://localhost:3000/categorie/' + id);
    //response.auth = false;
    // Wenn der Benutzer eingeloggt und Administrator ist, werden Bearbeitungsrechte hinzugefügt
    /*if (utils.auth(req)) {
        response.data.forEach(element => {
            element.edit = true;
        });
        response.auth = true;
    }*/
    console.log(response.data);
    // Filtert die Equipment-Daten basierend auf einer Suchanfrage

    return response;
};

const getSinglePort = async (id) => {
    console.log("ID: " + id);
    let response = await axios.get('http://localhost:3000/portolio/' + id);
    
    };

module.exports = {
    getAllPortfolioData,
    getPortolios,
    getSinglePort
}