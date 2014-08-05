var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');
var nconf = require('nconf');

var database = require('../database.js');

nconf.argv().file({file: nconf.get('config')});

var mongoUri = nconf.get('mongodbUri');

/* GET home page. */
router.get('/all', function(req, res) {
    database.getAllData(function(err, doc){
        res.json(doc);
    });
});

router.get('/graph', function(req, res) {
    res.send("Site structure has changed. Graph now at, <a href='bouldermc.dyndns.info:3000/graph/all'>bouldermc.dyndns.info:3000/graph/all</a>");
});

router.get('/today', function(req, res) {
    var today = new Date();
    today.setHours(0,0,0,0);
    today = today.toISOString();

    database.getDayData(function(err, doc){
        res.json(doc);
    });
});

router.get('/:year/:month/:day', function(req, res) {
    var year = req.params.year;
    var month = req.params.month;
    var day = req.params.day;

    if(year.match(/\d{4}/g) == null || month.match(/[0-1]\d/g) == null || day.match(/[0-3]\d/g) == null){
        if (req.accepts('html')) {
            res.render('404', { url: req.url + " Invalid date" });
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
        res.json(doc);                   
    });
});

module.exports = router;
