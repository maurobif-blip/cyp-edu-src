// the default PIN of the computer file, read from local/pin.txt (not in the repository)
module.exports = require('fs').readFileSync(__dirname + '/../local/pin.txt', 'utf8').trim();
