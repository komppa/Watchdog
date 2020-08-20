var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var api_v1 = require('./routes/api_v1');
var api_portal = require('./routes/api_portal');
var app = express();
var cors = require('cors')


// For development purposes

app.use(cors({
  credentials: true,
  origin: "http://localhost:3001"
}));



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());  
app.use(express.static(path.join(__dirname, 'public')));

// Web portal 
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/dashboard', express.static(path.join(__dirname, 'public')))
app.use('/login', express.static(path.join(__dirname, 'public')))
app.use('/register', express.static(path.join(__dirname, 'public')))

// APIs - Thingy and webportal
app.use('/api/v1', api_v1);
app.use('/api/portal', api_portal);

// Catch 404 page
app.use(function(req, res, next) {
  res.json({
    status: "Failure",
    reason: "I don't know what you want :(",
    err_code: "kinda404"
  })
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

const port = 3030
app.listen(port, () => console.log("App running on port ", port))