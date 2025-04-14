var fs = require('fs');
var data = fs.readFileSync('models/categorie.json', 'utf8');

let categorie = JSON.parse(data);
if (data.length > 0) {
    categorie = JSON.parse(data);
} else {
    categorie = [];
}

//let userController = require('./usersController')



const getCategorieData = (req, res) => {
    console.log("GET Portfolio Data");
    return { status: 200, data: categorie };
}





module.exports = {
    getCategorieData
}