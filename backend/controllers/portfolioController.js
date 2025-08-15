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

const getPortfolioByCategorie = (req, res) => {
    console.log("GET Portfolio Data");

    let id;
    categorie.forEach(element => {
        if (element.slug === req) {
            id = parseInt(element.id);
        }
    });
    const filteredPortfolios = portfolios.filter(element => {
        return element.categoryID === id;
    });
    console.log("Filtered Portfolios: ", filteredPortfolios);

    if (filteredPortfolios.length === 0) {
        return { status: 404, data: "No portfolios found for this category" };
    }

    return { status: 200, data: filteredPortfolios };
};


const getSinglePortfolio = async (slug) => {

    const portfolio = portfolios.find(element => element.slug === slug);
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }

   return {status: 200, data: portfolio };
};

module.exports = {
    getPortfolioData,
    getPortfolioByCategorie,
    getSinglePortfolio
}