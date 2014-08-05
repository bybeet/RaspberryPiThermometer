var settings = require('./settings');

var db = require('monk')(settings.mongoUri), temperatures = db.get('temperature_data');

module.exports = {
    getAllData: function(callback) {
        temperatures.find({}, '-_id',  function(err, doc) {
            callback(err, doc);
        });
    },
    getDayData: function(date, callback) {
        temperatures.find({timestamp: {$gte: date.toISOString()}}, '-_id',  function(err, doc) {
            callback(err, doc);
        });
    },
    getDateRangeData: function(begin, end, callback) {
        temperatures.find({timestamp: {$gte: begin.toISOString(), $lt: end.toISOString() }}, '-_id',  function(err, doc) {
            callback(err, doc);
        });
    },
}
