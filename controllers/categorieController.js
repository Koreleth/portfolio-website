let store = require('../models/store');

const getCategorieData = () => {
    return { status: 200, data: store.read('categorie') };
}

module.exports = {
    getCategorieData
}
