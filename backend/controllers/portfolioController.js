const e = require('express');
var fs = require('fs');
const { get } = require('http');
var data = fs.readFileSync('models/portfoliowork.json', 'utf8');

let portfolios = JSON.parse(data);
if (data.length > 0) {
    portfolios = JSON.parse(data);
} else {
    portfolios = [];
}

//let userController = require('./usersController')



const getPortfolioData = (req, res) => {
    console.log("GET Portfolio Data");
    return { status: 200, data: portfolios };
}

const getPortfolioByCategorie = (req, res) => {
    console.log("GET Portfolio Data");

    const Id = parseInt(req); // z. B. /portfolio/123
    const filteredPortfolios = portfolios.filter(element => {
        return element.categoryID === Id;
    });
    console.log("Filtered Portfolios: ", filteredPortfolios);

    if (filteredPortfolios.length === 0) {
        return { status: 404, data: "No portfolios found for this category" };
    }

    return { status: 200, data: filteredPortfolios };
};





module.exports = {
    getPortfolioData,
    getPortfolioByCategorie
}