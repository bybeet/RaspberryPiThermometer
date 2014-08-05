var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');
var nconf = require('nconf');

var settings = require('../modules/settings');

var forecastIOUrl = 'https://api.forecast.io/forecast';

/* GET indoor temperature page. */
router.get('/indoors', function(req, res) {
    fs.readFile(settings.temperatureInput, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var line = data.match(/\d{5}/g);
        var temperature = line/1000;
        res.send(JSON.stringify({ temperature: celciusToFahrenheit(parseInt(temperature)) }));
    });
});

/* GET outdoor temperature page. */
router.get('/outdoors', function(req, res) {
    getOutsideTemperature(settings.forecastIOApiKey, settings.locationLatLong, res);
});

function getOutsideTemperature(apiKey, latitudeAndLongitude, response) {
    if(response == null) {
        console.log("Null res as input");
    }
    var temp = '';
    https.get(forecastIOUrl + "/" + apiKey + "/" + latitudeAndLongitude, function(res) {
        console.log("Got response: " + res.statusCode);
        var data = '';
        res.on('data', function (chunk){
            data += chunk;
        });

        res.on('end',function(){
            var obj = JSON.parse(data);
            temp = obj.currently.temperature;
            if(response == null) {
                return temp;
            }
            response.send(JSON.stringify({ temperature: temp }));
        })
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

function celciusToFahrenheit(value) {
    return (value * 9 / 5) + 32;
}


module.exports = router;
