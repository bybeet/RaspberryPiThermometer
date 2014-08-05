var nconf = require('nconf');

nconf.argv().file({file: nconf.get('config')});

var mongoUri = nconf.get('mongodbUri');
var forecastIOApiKey = nconf.get('forecastIOApiKey');
var locationLatLong = nconf.get('locationLatLong');
var temperatureInput = nconf.get('temperatureInput');

module.exports = {
    "mongoUri": mongoUri,
    "forecastIOApiKey": forecastIOApiKey,
    "locationLatLong": locationLatLong,
    "temperatureInput": temperatureInput
}
