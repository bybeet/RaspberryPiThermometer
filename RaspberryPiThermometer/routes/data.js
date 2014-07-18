var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');

var mongouser = "rpi_read";
var mongopassword = "testrpi"
var mongoUri = "mongodb://" + mongouser + ":" + mongopassword + "@ds027729.mongolab.com:27729/raspberrypi_test"; 
console.log("MongoUri: " + mongoUri);

/* GET home page. */
router.get('/', function(req, res) {
    // res.render('index', { title: 'Express' });
    res.send("Hello world!");
});

router.get('/graph', function(req, res) {
    var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

    temperatures.find({}, '-_id',  function(err, doc) {
        if(err) throw err;
        if(doc == undefined) db.close();

        var outdoorTemperatures = new Array();
        var indoorTemperatures = new Array();
        var timestamps = new Array();

        for(var i=0; i < doc.length; i++){
            outdoorTemperatures[i] = doc[i].outdoorTemperature;
            indoorTemperatures[i] = doc[i].indoorTemperature;
            var time = new Date(doc[i].timestamp);
            timestamps[i] = time.toLocaleTimeString();
        }

        var now = new Date();

        res.render('tempgraph', { date: now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate(), timestamps: JSON.stringify(timestamps), outTemp: outdoorTemperatures, inTemp: indoorTemperatures });
    });

    // temp.findById('53c8c32474fece16861a73fa', function(err, item) {
    //    console.log(item);
    // });

    /*
    var client = require('mongodb').MongoClient, format = require('util').format;
    client.connect(mongoUri, function(err, db) {
        if(err) throw err;

        

        db.collectionNames(function(err, list) {
            console.log(list);
        });
        
        var temperature_data = db.collection('temperature_data');
        // console.log(temperature_data);
        temperature_data.find().toArray(function(err, items){
            console.log(items); 
        });

        var stream = temperature_data.find({indoorTemperature:{$ne:73.625}}).stream();
        stream.on("data", function(item) {});
        stream.on("end", function() {});

        db.close();
        res.send("Test");
    });
    */

});

module.exports = router;
