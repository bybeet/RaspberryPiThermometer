var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');
var nconf = require('nconf');

nconf.argv().file({file: nconf.get('config')});

var mongoUri = nconf.get('mongodbUri');

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
    res.send("Site structure has changed. Graph now at, <a href='bouldermc.dyndns.info:3000/graph/all'>bouldermc.dyndns.info:3000/graph/all</a>");
});

router.get('/today', function(req, res) {
    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    var today = new Date();
    today.setHours(0,0,0,0);
    today = today.toISOString();

    temperatures.find({timestamp: {$gte: today}}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) db.close();

        res.json(doc);
    });
});

router.get('/:year/:month/:day', function(req, res) {
    var year = req.params.year;
    var month = req.params.month;
    var day = req.params.day;

    if(year.match(/\d{4}/g) == null || month.match(/[0-1]\d/g) == null || day.match(/[0-3]\d/g) == null){
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

    res.send("Not yet implemented . . . " + req.url);                   
});

module.exports = router;
