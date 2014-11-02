var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');
var util = require('util');

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
            renderGraphData(res, doc, "All available data");
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
    var newUrl = "" + today.getFullYear() + "/" + ("0" + (today.getMonth() + 1)).slice(-2) + "/" + ("0" + today.getDate()).slice(-2);
    res.redirect(newUrl);
});

router.get('/:year/:month/:day', function(req, res) {
    // Month is 0-based . . . 
    var year = req.params.year;
    var month = req.params.month;
    var day = req.params.day;

    var span = req.param('span');
    if(span == undefined) {
        span = 1;
    }
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
    var end = new Date(begin.getTime() + (span * 24 * 60 * 60 * 1000));

    database.getDateRangeData(begin, end, function(err, doc){
        if(doc.length == 0) {
            if(req.accepts('html')){
                handleNoDataResponse(res, begin);
                return;
            }

            if(req.accepts('json')) {
                res.json(doc);
                return;
            }
        }

        var header;
        if(span == 1){
            header = begin.toLocaleDateString();
        } else {
            var endDateOutput = new Date(end.getTime() - (24 * 60 * 60 * 1000));
            header = begin.toLocaleDateString() + " to " + endDateOutput.toLocaleDateString();
        }

        if(req.accepts('html')){
            renderGraphData(res, doc, header);
            return;
        }

        if(req.accepts('json')) {
            res.json(doc);
            return;
        }
    });
});
    
function renderGraphData(res, doc, date) {
    var outdoorTemperatures = new Array();
    var indoorTemperatures = new Array();
    var timestamps = new Array();

    var j=0
    var skip=Math.ceil(doc.length/250);

    var previousDate = new Date(0);
    var indoorHigher = 0.0;

    var endDate = new Date(doc[doc.length-1].timestamp);
    var labelTime = false;

    if(new Date(previousDate.getTime() + (24*60*60*1000)) >= endDate) {
        labelTime = true;    
    }

    for(var i=0; i < doc.length; i+=skip){
        if(i >= doc.length) break;
        outdoorTemperatures[j] = doc[i].outdoorTemperature;
        indoorTemperatures[j] = doc[i].indoorTemperature;
        if(doc[i].indoorTemperature >= doc[i].outdoorTemperature) {
            indoorHigher++;
        }
        var time = new Date(doc[i].timestamp);
        if(labelTime) {
            if( time.getHours() != previousDate.getHours()) {
                timestamps[j] = time.toLocaleTimeString();
                previousDate = time;
            } else {
                timestamps[j] = "";
            }
        } else {
            if( time.getDate() != previousDate.getDate()) {
                timestamps[j] = time.toLocaleDateString();
                previousDate = time;
            } else {
                timestamps[j] = "";
            }
        }
        j++;
    }

    res.render('graph', { date: date, timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures, indoorHigher: indoorHigher });
}

function handleNoDataResponse(res, date) {
    // Check to see if given date is in the future
    var today = new Date();

    if(date > today) {
        res.send(util.format("%s is in the future!", date.toLocaleDateString()));
    } else {
        res.send(util.format("No data available for date %s", date.toLocaleDateString()));
    }
}

module.exports = router;
