var fs = require('fs');
const { get } = require('http');
var data = fs.readFileSync('models/lifeline.json', 'utf8');

let lifeline = JSON.parse(data);
if (data.length > 0) {
    lifeline = JSON.parse(data);
} else {
    lifeline = [];
}

getLifeline = (req, res) => {
    return { status: 200, data: lifeline };
}


module.exports = {
    getLifeline
}