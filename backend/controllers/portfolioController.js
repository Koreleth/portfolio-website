const e = require('express');
var fs = require('fs');
const { get } = require('http');
var data = fs.readFileSync('models/portfoliowork.json', 'utf8');
var data2 = fs.readFileSync('models/categorie.json', 'utf8');

let portfolios = JSON.parse(data);
if (data.length > 0) {
    portfolios = JSON.parse(data);
} else {
    portfolios = [];
}
let categorie = JSON.parse(data2);
if (data2.length > 0) {
    categorie = JSON.parse(data2);
} else {
    categorie = [];
}

//let userController = require('./usersController')



const getPortfolioData = (req, res) => {
    console.log("GET Portfolio Data");
    return { status: 200, data: portfolios };
}

const getPortfolioByCategorie = (slug) => {
    console.log("GET Portfolio Data");

    const categorieEntry = categorie.find(element => element.slug === slug);
    if (!categorieEntry) {
        return { status: 404, data: "Categorie not found" };
    }

    // Eine Kategorie ohne Projekte ist kein Fehler, sondern liefert eine leere Liste
    const filteredPortfolios = portfolios.filter(element => {
        return element.categoryID === parseInt(categorieEntry.id);
    });
    console.log("Filtered Portfolios: ", filteredPortfolios);

    return { status: 200, data: { categorie: categorieEntry, portfolios: filteredPortfolios } };
};


const getSinglePortfolio = async (catSlug, slug) => {

    // Das Projekt muss zur angefragten Kategorie gehören
    const categorieEntry = categorie.find(element => element.slug === catSlug);
    const portfolio = categorieEntry && portfolios.find(element => {
        return element.slug === slug && element.categoryID === parseInt(categorieEntry.id);
    });
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }

   return {status: 200, data: { ...portfolio, categorie: categorieEntry } };
};

module.exports = {
    getPortfolioData,
    getPortfolioByCategorie,
    getSinglePortfolio
}