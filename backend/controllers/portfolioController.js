var fs = require('fs');
var data = fs.readFileSync('models/portfoliowork.json', 'utf8');

let portfolios = JSON.parse(data);
if (data.length > 0) {
    portfolios = JSON.parse(data);
} else {
    portfolios = [];
}

//let userController = require('./usersController')



const getAllPortfolios = (req, res) => {
    return { status: 200, data: portfolios };
}





module.exports = {
    getAllPortfolios
}