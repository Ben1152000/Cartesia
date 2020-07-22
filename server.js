var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const userType = {
  NONE: 0,
  HOST: 1,
  GUEST: 2,
}

let servers = {};
let users = {};

// Statically serve assets/ directory
app.use('/assets', express.static('assets'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/**
 * socket.io messages:
 * 
 * HOST:
 * requests:
 * - host(id) // request to host a server
 * - push(map) // send map to guests
 * - move(sprite) // send sprite to guests
 * 
 * responses:
 * - host-success // response to host request
 * - host-failure // response to host request
 * - join // when guest joins
 * - move(sprite) // when guest sends sprites
 * 
 * GUEST:
 * requests:
 * - join(id) // request to join a server
 * - move(sprite) // send sprites to guests
 * 
 * responses:
 * - join-success // response to join request
 * - join-failure // response to join request
 * - push(map) // when host sends map
 * - move(sprite) // when host/guest sends sprites
 * - close // when server closes
 * 
 */
io.on('connection', (socket) => {

  console.log('user connected: ' + socket.id);
  users[socket.id] = {
    type: userType.NONE,
    server: null
  };

  socket.on('disconnect', () => {
    console.log('user disconnected: ' + socket.id);
    // If the user is a host, close their server:
    if (users[socket.id].type === userType.GUEST) {
      servers[users[socket.id].server].guests.delete(socket.id);
    }
    if (users[socket.id].type === userType.HOST) {
      // Tell each guest the server has closed:
      servers[users[socket.id].server].guests.forEach(
        guest => io.sockets.connected[guest].emit('close')
      );
      servers[users[socket.id].server].guests.forEach(
        guest => io.sockets.connected[guest].disconnect()
      );
      delete servers[users[socket.id].server];
    }
    delete users[socket.id];
  });

  socket.on('host', (packet) => {
    console.log('host:', packet);
    // If the user is already a host/guest, return failure:
    if (users[socket.id].type !== userType.NONE) {
      console.log('ERROR:', 'User already has type: ' + users[socket.id].type);
      socket.emit('host-failure', {
        'message': 'User already has type: ' + users[socket.id].type
      });
      return;
    }
    // If the id is not a positive integer, return failure:
    if (!Number.isSafeInteger(packet.id) || packet.id < 0) {
      console.log('ERROR:', 'Server id must be a positive integer.');
      socket.emit('host-failure', {
        'message': 'Server id must be a positive integer.'
      });
      return;
    }
    // If the server id already exists, return failure:
    if (packet.id in servers) {
      console.log('ERROR:', 'There is already a server with id: ' + packet.id);
      socket.emit('host-failure', {
        'message': 'There is already a server with id: ' + packet.id
      });
      return;
    }
    servers[packet.id] = {host: socket.id, guests: new Set(), editing: false};
    users[socket.id].type = userType.HOST;
    users[socket.id].server = packet.id;
    socket.emit('host-success', {'id': packet.id});
  });

  socket.on('join', (packet) => {
    console.log('join:', packet);
    // If the user is already a host/guest, return failure:
    if (users[socket.id].type !== userType.NONE) {
      console.log('ERROR:', 'User already has type: ' + users[socket.id].type);
      socket.emit('join-failure', {
        'message': 'User already has type: ' + users[socket.id].type
      });
      return;
    }
    // If the id is not a positive integer, return failure:
    if (!Number.isSafeInteger(packet.id) || packet.id < 0) {
      console.log('ERROR:', 'Server id must be a positive integer.');
      socket.emit('join-failure', {
        'message': 'Server id must be a positive integer.'
      });
      return;
    }
    // If the server id does not exist, return failure:
    if (!(packet.id in servers)) {
      console.log('ERROR:', 'There is no server with id: ' + packet.id);
      socket.emit('join-failure', {
        'message': 'There is no server with id: ' + packet.id
      });
      return;
    }
    servers[packet.id].guests.add(socket.id);
    io.sockets.connected[servers[packet.id].host].emit('join');
    users[socket.id].type = userType.GUEST;
    users[socket.id].server = packet.id;
    socket.emit('join-success', {'id': packet.id});
  });

  socket.on('push', (packet) => {
    console.log('push:', packet.name);
    // If the user is not a host, return failure:
    if (users[socket.id].type !== userType.HOST) { 
      console.log('ERROR:', 'Non-host user tried to push.');
      return; 
    }
    servers[users[socket.id].server].guests.forEach(
      guest => io.sockets.connected[guest].emit('push', packet)
    );
  });

  socket.on('move', (packet) => {
    console.log('move:', packet.id);
    // If the user is not a host or guest, return failure:
    if (users[socket.id].type === userType.NONE) { 
      console.log('ERROR:', 'Non-connected user tried to move.');
      return; 
    }
    // If the server does not have editing enabled, return failure:
    if (users[socket.id].type === userType.GUEST && !servers[users[socket.id].server].editing) {
      console.log('ERROR:', 'Non-host user tried to move.');
      return;
    }
    io.sockets.connected[servers[users[socket.id].server].host].emit('move', packet)
    servers[users[socket.id].server].guests.forEach(
      guest => io.sockets.connected[guest].emit('move', packet)
    );
  });

  socket.on('settings', (packet) => {
    // If the user is not a host, return failure:
    console.log('settings:', packet);
    if (users[socket.id].type !== userType.HOST) {
      console.log('ERROR:', 'Non-host user tried to change settings.');
      return;
    }
    if ('editing' in packet) {
      servers[users[socket.id].server].editing = packet.editing;
    }
  });

  socket.on('log', (packet) => {
    console.log('servers:', servers);
    console.log('users:', users);
  });

});

/*var server = http.listen(3000, "0.0.0.0", () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Serving HTTP on " + host + " port " + port + " (http://" + host + ":" + port + "/) ...");
});*/

var server = http.listen(process.env.PORT || 3000, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Serving HTTP on port " + port + " ...");
});