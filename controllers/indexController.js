var categorieController = require('./categorieController');
var personaldataController = require('./personaldataController');
var aboutController = require('./aboutController');


/**
 * Holt die Index-Daten für die Startseite.
 * @returns {Object} - Die Antwort mit Status, Daten und Seitentitel.
 */
const getIndex = () => {
    return {
        status: 200,
        data: {
            categories: categorieController.getCategorieData().data,
            lifeline: personaldataController.getLifeline().data,
            about: aboutController.getAboutData().data
        },
        title: "Home"
    };
}

module.exports = {
    getIndex
}
