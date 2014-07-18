var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');

var env = process.env.NODE_ENV || 'dev';
if(env == 'dev'){
    var dataFile = '/Users/travisbybee/Scratch/test.txt';
} else {
    var dataFile = '/sys/bus/w1/devices/28-0000052fb8e6/w1_slave';
}

var forecastIOUrl = 'https://api.forecast.io/forecast';
var forecastIOApiKey = 'ebfdb78dac1e6a2bd146e91bd14db64f';
var locationLatLong = '40.020187,-105.274141';

// console.log("Running on " + env + ". DataFile set to " + dataFile);

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
});

/* GET indoor temperature page. */
router.get('/temperature/indoors', function(req, res) {
    fs.readFile(dataFile, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var line = data.match(/\d{5}/g);
        var temperature = line/1000;
        res.send(JSON.stringify({ temperature: celciusToFahrenheit(parseInt(temperature)) }));
    });
});

/* GET outdoor temperature page. */
router.get('/temperature/outdoors', function(req, res) {
    getOutsideTemperature(forecastIOApiKey, locationLatLong, res);
});

/* GET test graph page. */
router.get('/graph', function(req, res) {
    res.render('graph', {title: 'Graph'});
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
