var express = require('express');
var router = express.Router();
var axios = require('axios');

const getLifeline = async (req) => {
 let response = await axios.get('http://localhost:3000/lifeline');
 return response;
}

module.exports = {
    getLifeline
}
