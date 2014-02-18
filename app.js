
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var twilio = require("twilio");
var url = require("url");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.post('/call', function(req, res) {
  var to = req.body.calluser; 
  var sid = YOUR_SID;
  var auth = YOUR_TOKEN;
  var client = twilio(sid, auth);
  var appurl = "YOUR_SERVER_URL_INDEX:3000/ivr/step1"; 
  client.makeCall({
  to     : VERIFIED_NUMBER_TO_CALL, 
  from   : VERFIED_NUMBER_CALL_FROM,
  url    : appurl,
  method : "GET"
 }, function(err, resp) {
      if(err) 
        console.log(err); 
      else {
        console.log("Sample call sent !"); 
        console.log(resp.from);
        console.log(resp.uri); 
        
   }
 });
}); 


//create a route for initial call
app.get('/ivr/step1', function(req, res) {
  var resp = new twilio.TwimlResponse();
  resp.gather(function() {
    this.say({voice:"woman"}," Hi! Welcome to Trade Shipping Company. Please enter your PIN number followed by a hash.");
      }, {action : '/ivr/step2', method:'POST'});
  res.writeHead(200,{
    'Content-Type':'text/xml'
  });
  res.end(resp.toString());
});

app.post('/ivr/step2', function(req, res) {
  console.log("Connected to step 2 of ivr system");
  var digits=req.body['Digits'];
  var resp = new twilio.TwimlResponse() ;
    resp.gather(function() {
      this.say({voice : "woman"}, "Thank you for your response.");
      this.say({voice : "woman"},"You pressed, "+digits);
      this.say({voice : "woman"},"Please verify by pressing 1 if correct, else press 0");
   }, {action : '/ivr/step3', method:'POST'});
  res.writeHead(200, {
    'Content-Type':'text/xml'
  });
  res.end(resp.toString());
});

app.post('/ivr/step3', function(req, res) {
  var confirm = req.body['Digits'];
  var resp = new twilio.TwimlResponse();
  if (confirm == 1){
    resp.gather(function() {
      this.say({voice:"woman"}, "Thanks for the confirmation. Your order will be processed. Bye !");
    },{action:'/', method:'GET'});
    resp.hangup();
  }
  else if (confirm == 0) {
    resp.gather(function() {
      this.say({voice:"woman"}, "Sorry! You need to enter your pin again!");
    }, {action : '/ivr/step1', method : 'GET'});
  }
  else {
    resp.gather(function() {
      this.say({voice:"woman"}, "You pressed something wrong. Please enter your pin again!");
    },{action: "/ivr/step1", method : "GET"});
  }
  res.writeHead(200, {
   "Content-Type":"text/xml"
  });
  res.end(resp.toString());
}); 
  
    
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
