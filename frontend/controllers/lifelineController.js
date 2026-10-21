var express = require('express');
var router = express.Router();
var axios = require('axios');
var config = require('../config');

const getLifeline = async (req) => {
 let response = await axios.get(config.backendUrl + '/lifeline');
 return response;
}

module.exports = {
    getLifeline
}
