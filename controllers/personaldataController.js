let store = require('../models/store');

const getLifeline = () => {
    return { status: 200, data: store.read('lifeline') };
}

module.exports = {
    getLifeline
}
