var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');

var mongouser = "rpi_read";
var mongopassword = "testrpi"
var mongoUri = "mongodb://" + mongouser + ":" + mongopassword + "@ds027729.mongolab.com:27729/raspberrypi_test"; 

/* GET home page. */
router.get('/all', function(req, res) {
    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    temperatures.find({}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) db.close();
        res.json(doc);
    });
});

router.get('/graph', function(req, res) {
    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    temperatures.find({}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) db.close();

        var outdoorTemperatures = new Array();
        var indoorTemperatures = new Array();
        var timestamps = new Array();

        var j=0
        for(var i=0; i < doc.length; i+=2){
            outdoorTemperatures[j] = doc[i].outdoorTemperature;
            indoorTemperatures[j] = doc[i].indoorTemperature;
            var time = new Date(doc[i].timestamp);
            timestamps[j] = time.toLocaleTimeString();
            j++;
        }

        var now = new Date();

        res.render('tempgraph', { date: now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate(), timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
    });
});

module.exports = router;
