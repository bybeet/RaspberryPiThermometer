var nconf = require('nconf');

nconf.argv().file({file: nconf.get('config')});

var mongoUri = nconf.get('mongodbUri');
var db = require('monk')(mongoUri), temperatures = db.get('temperature_data');

module.exports = {
    getAllData: function() {
        var doc = temperatures.find({}, '-_id',  function(err, doc) {
            if(err) throw err;
            if(doc == undefined) {
                db.close();
                res.send("404");
            }
            return doc;
        });
            console.log(doc);
        return doc;
    },
    getDayData: function(date) {
        temperatures.find({timestamp: {$gte: date.toISOString()}}, '-_id',  function(err, doc) {
            if(err) throw err;
            if(doc == undefined) {
                db.close();
                res.send("404");
            }
            return doc;
        });
    },
    getDateRangeData: function(begin, end) {
        temperatures.find({timestamp: {$gte: being.toISOString(), $lt: end.toISOString() }}, '-_id',  function(err, doc) {
            if(err) throw err;
            if(doc == undefined) {
                db.close();
                res.send("404");
            }
            return doc;
        });
    },
}
