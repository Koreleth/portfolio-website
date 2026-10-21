let store = require('../models/store');

// Alle Tools (Programme) mit Name und Icon, z. B. für die Auswahl im Admin-Bereich
const getToolData = () => {
    return { status: 200, data: store.read('tools') };
}

module.exports = {
    getToolData
}
