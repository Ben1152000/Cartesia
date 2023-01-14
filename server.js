const express = require("express");
const { createServer } = require("http");

const app = express();
const httpServer = createServer(app);
const io = require("socket.io")(httpServer, { /* options */ 
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true
  },
  allowEIO3: true
});

// This is the old client functionality, only here for testing.
const path = require("path");
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use("/assets", express.static("assets"))  // Statically serve assets/ directory
app.get("/", (req, res) => { res.sendFile(__dirname + "/index.html"); });


const userType = { NONE: 0, HOST: 1, GUEST: 2 }
let servers = {};
let users = {};

// Log message to console
function log(type, user, data) {
  if (typeof data !== "undefined") {
    console.log(type.toUpperCase() + ":", "(" + user + ")", data);
  } else {
    console.log(type.toUpperCase() + ":", "(" + user + ")");
  }
}

// Log error to console
function error(message) {
  console.log("\tERROR:", message);
}

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
io.on("connection", (socket) => {

  log("connected", socket.id);
  users[socket.id] = {
    type: userType.NONE,
    server: null
  };

  socket.on("disconnect", () => {
    log("disconnected", socket.id);
    // If the user is a host, close their server:
    if (users[socket.id].type === userType.GUEST) {
      let server = servers[users[socket.id].server];
      server.guests.delete(socket.id);
      if (server.host in io.sockets.connected) {
        io.sockets.connected[server.host].emit("leave", {players: server.guests.size});
      }
      server.guests.forEach(
        guest => io.sockets.connected[guest].emit("leave", {players: server.guests.size})
      );
    }
    if (users[socket.id].type === userType.HOST) {
      // Tell each guest the server has closed: (legacy)
      servers[users[socket.id].server].guests.forEach(
        guest => io.sockets.connected[guest].emit("close")
      );
      servers[users[socket.id].server].guests.forEach(
        guest => io.sockets.connected[guest].disconnect()
      );
      delete servers[users[socket.id].server];
    }
    delete users[socket.id];
  });

  socket.on("host", (packet) => {
    log("host", socket.id, packet.id);
    // If the user is already a host/guest, return failure:
    if (users[socket.id].type !== userType.NONE) {
      error("User already has type: " + users[socket.id].type);
      socket.emit("host-failure", {
        "message": "User already has type: " + users[socket.id].type
      });
      return;
    }
    // If the id is not a positive integer, return failure:
    if (!Number.isSafeInteger(packet.id) || packet.id < 0) {
      error("Server id must be a positive integer.");
      socket.emit("host-failure", {
        "message": "Server id must be a positive integer."
      });
      return;
    }
    // If the server id already exists, return failure:
    if (packet.id in servers) {
      error("There is already a server with id: " + packet.id);
      socket.emit("host-failure", {
        "message": "There is already a server with id: " + packet.id
      });
      return;
    }
    servers[packet.id] = {host: socket.id, guests: new Set(), editing: false};
    users[socket.id].type = userType.HOST;
    users[socket.id].server = packet.id;
    socket.emit("host-success", {"id": packet.id, "players": servers[packet.id].guests.size});
  });

  socket.on("join", (packet) => {
    log("join", socket.id, packet.id);
    // If the user is already a host/guest, return failure:
    if (users[socket.id].type !== userType.NONE) {
      error("User already has type: " + users[socket.id].type);
      socket.emit("join-failure", {
        "message": "User already has type: " + users[socket.id].type
      });
      return;
    }
    // If the id is not a positive integer, return failure:
    if (!Number.isSafeInteger(packet.id) || packet.id < 0) {
      error("Server id must be a positive integer.");
      socket.emit("join-failure", {
        "message": "Server id must be a positive integer."
      });
      return;
    }
    // If the server id does not exist, return failure:
    if (!(packet.id in servers)) {
      error("There is no server with id: " + packet.id);
      socket.emit("join-failure", {
        "message": "There is no server with id: " + packet.id
      });
      return;
    }
    io.sockets.connected[servers[packet.id].host].emit("join", {"players": servers[packet.id].guests.size + 1});
    servers[packet.id].guests.forEach(
      guest => io.sockets.connected[guest].emit("join", {"players": servers[packet.id].guests.size + 1})
    );
    servers[packet.id].guests.add(socket.id);
    users[socket.id].type = userType.GUEST;
    users[socket.id].server = packet.id;
    socket.emit("join-success", {
      "id": packet.id, 
      "players": servers[packet.id].guests.size, 
      "settings": {editing: servers[packet.id].editing}
    });
  });

  socket.on("push", (packet) => {
    log("push", socket.id, packet.name);
    // If the user is not a host, return failure:
    if (users[socket.id].type !== userType.HOST) { 
      error("Non-host user tried to push.");
      return; 
    }
    servers[users[socket.id].server].guests.forEach(
      guest => io.sockets.connected[guest].emit("push", packet)
    );
  });

  socket.on("move", (packet) => {
    log("move", socket.id, packet.id);
    // If the user is not a host or guest, return failure:
    if (users[socket.id].type === userType.NONE) { 
      error("Non-connected user tried to move.");
      return; 
    }
    // If the server does not have editing enabled, return failure:
    if (users[socket.id].type === userType.GUEST && !servers[users[socket.id].server].editing) {
      error("Non-host user tried to move.");
      return;
    }
    io.sockets.connected[servers[users[socket.id].server].host].emit("move", packet)
    servers[users[socket.id].server].guests.forEach(
      guest => io.sockets.connected[guest].emit("move", packet)
    );
  });

  socket.on("settings", (packet) => {
    // If the user is not a host, return failure:
    log("settings", socket.id, packet);
    if (users[socket.id].type !== userType.HOST) {
      error("Non-host user tried to change settings.");
      return;
    }
    changed = {};
    if ("editing" in packet) {
      servers[users[socket.id].server].editing = packet.editing;
      changed.editing = packet.editing;
    }
    io.sockets.connected[servers[users[socket.id].server].host].emit("settings", changed)
    servers[users[socket.id].server].guests.forEach(
      guest => io.sockets.connected[guest].emit("settings", changed)
    );
  });

  socket.on("log", (packet) => {
    console.log("servers:", servers);
    console.log("users:", users);
  });

});

// var server = http.listen(8040, "0.0.0.0", () => {
//   var host = server.address().address;
//   var port = server.address().port;
//   console.log("Serving HTTP on " + host + " port " + port + " (http://" + host + ":" + port + "/) ...");
// });

const dns = require("dns");
const os = require("os");
const server = httpServer.listen(process.env.PORT || 8040, () => {
  const port = server.address().port;
  dns.lookup(os.hostname(), function (err, host, fam) {
    console.log("Serving HTTP on " + host + ":" + port + " ...");
  })
});
