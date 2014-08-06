var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');

var database = require('../modules/database');
var settings = require('../modules/settings');

/* GET home page. */
router.get('/all', function(req, res) {
    // Currently outputs all data.
    database.getAllData(function(err, doc) {
        if(err) throw err;
        if(doc == undefined) {
            res.send("404");
        }

        if(req.accepts('html')){
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

            res.render('graph', { date: "All available data", timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
        }

        if(req.accepts('json')) {
            res.json(doc);
            return;
        }

    });

});

router.get('/d3test', function(req, res) {
    res.render('d3test', {});
});

router.get('/today', function(req, res) {
    var today = new Date();
    today.setHours(0,0,0,0);

    database.getDayData(today, function(err,doc){
        if(doc.length == 0) {
            db.close();
            res.render("nodata", {date : today.toLocaleDateString()});
            return;
        }

        if(req.accepts('html')){
            var outdoorTemperatures = new Array();
            var indoorTemperatures = new Array();
            var timestamps = new Array();

            var lastDate = new Date(doc[0].timestamp);

            var j=0;
            var indoorHigher = 0.0;
            for(var i=0; i < doc.length; i+=1){
                outdoorTemperatures[j] = doc[i].outdoorTemperature;
                indoorTemperatures[j] = doc[i].indoorTemperature;
                
                if(doc[i].indoorTemperature >= doc[i].outdoorTemperature) {
                    indoorHigher++;
                }

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

            res.render('graph', { date: today.toLocaleDateString(), timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures, indoorHigher: indoorHigher });
        }

        if(req.accepts('json')) {
            res.json(doc);
            return;
        }
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

    var begin = new Date(year, month - 1, day);
    var end = new Date(begin.getTime() + (24 * 60 * 60 * 1000));

    database.getDateRangeData(begin, end, function(err, doc){
        if(doc.length == 0) {
            console.log("Length is zero . . .");
            res.send("No data available for date %s/%s/%s" % (year, month, day));
            return;
        }

        if(req.accepts('html')){
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

            res.render('graph', { date: begin.toLocaleDateString(), timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
        }
        if(req.accepts('json')) {
            res.json(doc);
            return;
        }
    });
});
    
router.get('/:year/:week', function(req, res) {
    // Month is 0-based . . . 
    var year = req.params.year;
    var week = req.params.week;

    if(year.match(/^\d{4}$/g) == null || week.match(/^[0-5]\d$/g) == null){
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

    res.send("Not implemented yet . . .\n" + req.url);
});

module.exports = router;
