var fs = require('fs');

module.exports = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert':fs.readFileSync('./https/cert.pem')
}