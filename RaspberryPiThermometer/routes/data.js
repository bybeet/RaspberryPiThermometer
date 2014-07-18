var express = require('express');
var router = express.Router();
var fs = require('fs');
var https = require('https');

/* GET home page. */
router.get('/', function(req, res) {
    // res.render('index', { title: 'Express' });
    res.send("Hello world!");
});

module.exports = router;
