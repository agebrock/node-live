var fs = require('fs');

module.exports.readFile = function () {
    return fs.readFileSync('test.txt');
};