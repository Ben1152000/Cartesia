// This is the old client functionality separated out from server.js. Do not use!!!
// To test the client, simply run `python3 -m http.server` to statically serve.

var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/popper.js/dist/umd')) // redirect popper.js
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS

// Statically serve assets/ directory
app.use('/assets', express.static('assets'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/*var server = http.listen(3000, "0.0.0.0", () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Serving HTTP on " + host + " port " + port + " (http://" + host + ":" + port + "/) ...");
});*/

var server = http.listen(process.env.PORT || 3000, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Serving HTTP on " + port + " ...");
});