var express = require('express');
var router = express.Router();

/* GET web portal */
router.get('/', function(req, res, next) {
    app.use('/', serveIndex('/public'));
});

module.exports = router;
