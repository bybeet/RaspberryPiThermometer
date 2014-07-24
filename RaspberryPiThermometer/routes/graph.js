var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');

var mongouser = "rpi_read";
var mongopassword = "testrpi"
var mongoUri = "mongodb://" + mongouser + ":" + mongopassword + "@ds027729.mongolab.com:27729/raspberrypi_test"; 

/* GET home page. */
router.get('/all', function(req, res) {
    // Currently outputs all data.
    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    temperatures.find({}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) db.close();

        var outdoorTemperatures = new Array();
        var indoorTemperatures = new Array();
        var timestamps = new Array();

        var j=0
        var skip=Math.ceil(doc.length/250);

        var lastDate = new Date(doc[0].timestamp);

        for(var i=0; i < doc.length; i+=skip){
            if(i >= doc.length) break;
            outdoorTemperatures[j] = doc[i].outdoorTemperature;
            indoorTemperatures[j] = doc[i].indoorTemperature;
            var time = new Date(doc[i].timestamp);
            if( time.getDate() != lastDate.getDate()) {
                timestamps[j] = time.toLocaleDateString();
                lastDate = time;
            } else {
                timestamps[j] = "";
            }
            j++;
        }

        var now = new Date();

        res.render('tempgraph', { date: "All available data", timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
    });
});

router.get('/d3test', function(req, res) {
    res.render('d3test', {});
});

router.get('/today', function(req, res) {
    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    var today = new Date();
    today.setHours(0,0,0,0);

    temperatures.find({timestamp: {$gte: today.toISOString()}}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) {
            db.close();
            res.send("404");
        }

        if(doc.length == 0) {
            console.log("Length is zero . . .");
            db.close();
            res.render("nodata", {date : today.toLocaleDateString()});
            return;
        }

        var outdoorTemperatures = new Array();
        var indoorTemperatures = new Array();
        var timestamps = new Array();

        var lastDate = new Date(doc[0].timestamp);

        var j=0
        for(var i=0; i < doc.length; i+=1){
            outdoorTemperatures[j] = doc[i].outdoorTemperature;
            indoorTemperatures[j] = doc[i].indoorTemperature;
            var time = new Date(doc[i].timestamp);
            if( time.getHours() != lastDate.getHours()) {
                timestamps[j] = time.toLocaleTimeString();
                lastDate = time;
            } else {
                timestamps[j] = "";
            }
            j++;
        }

        var now = new Date();

        res.render('tempgraph', { date: today.toLocaleDateString(), timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
    });
});

router.get('/:year/:month/:day', function(req, res) {
    // Month is 0-based . . . 
    var year = req.params.year;
    var month = req.params.month;
    var day = req.params.day;

    if(year.match(/^\d{4}$/g) == null || month.match(/^[0-1]\d$/g) == null || day.match(/^[0-3]\d$/g) == null){
        if (req.accepts('html')) {
            res.render('404', { url: req.url });
            return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
    }

    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    var today = new Date(year, month - 1, day);
    var tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));


    temperatures.find({timestamp: {$gte: today.toISOString(), $lt: tomorrow.toISOString() }}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) db.close();

        if(doc.length == 0) {
            console.log("Length is zero . . .");
            db.close();
            res.send("No data available for date %s/%s/%s" % (year, month, day));
            return;
        }

        var outdoorTemperatures = new Array();
        var indoorTemperatures = new Array();
        var timestamps = new Array();

        var j=0
        for(var i=0; i < doc.length; i+=1){
            outdoorTemperatures[j] = doc[i].outdoorTemperature;
            indoorTemperatures[j] = doc[i].indoorTemperature;
            var time = new Date(doc[i].timestamp);
            timestamps[j] = time.toLocaleTimeString();
            j++;
        }

        var now = new Date();

        res.render('tempgraph', { date: today.toLocaleDateString(), timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
        return;
    });
});

module.exports = router;
