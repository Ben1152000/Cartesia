// This class acts as an interface with the server via socket.io
export class Io {

  constructor(hostname, port) {
    this.default_hostname = hostname; // ip address of socket server
    this.hostname = null; // use default hostname
    this.socket = null;
    this.port = port;
    this.active = false; // stores whether disconnection was voluntary
  }

  // Connect to socket.io:
  connect(callbacks) {
    if (this.socket) {
      console.log('already connected');
      callbacks.failure('Already connected to server.');
      return;
    }
    let address = "ws://" + ((this.hostname === null) ? this.default_hostname : this.hostname) + ":" + this.port;
    this.socket = io(address);
    console.log(address);

    this.socket.on('connect', () => {
      console.log('connected');
    });

    this.socket.on('connect_error', () => {
      console.log("connection error");
      if (!this.active) { // if the connection was never established delete the socket
        callbacks.failure('Unable to connect.');
        this.socket.disconnect();
        this.socket = null;
      }
    });

    this.socket.on('disconnect', () => {
      if (this.active) {
        callbacks.closed();
        this.disconnect();
      }
      console.log('disconnected');
      callbacks.disconnected();
    });

    this.socket.on('host-success', (packet) => {
      console.log('hosting server:', packet.id, 'players:', packet.players);
      this.active = true;
      callbacks.success(packet.id, packet.players);
    });

    this.socket.on('host-failure', (packet) => {
      console.log('error:', packet.message);
      this.disconnect();
      callbacks.failure(packet.message);
    });

    this.socket.on('join', (packet) => {
      console.log('guest joined;', 'players:', packet.players);
      callbacks.join(packet.players);
    });

    this.socket.on('leave', (packet) => {
      console.log('guest left;', 'players:', packet.players);
      callbacks.leave(packet.players);
    });

    this.socket.on('join-success', (packet) => {
      console.log('joined server:', packet.id, 'players:', packet.players);
      this.active = true;
      callbacks.success(packet.id, packet.players, packet.settings);
    });

    this.socket.on('join-failure', (packet) => {
      console.log('error:', packet.message);
      this.disconnect();
      callbacks.failure(packet.message);
    });

    this.socket.on('push', (packet) => {
      console.log('receiving map');
      callbacks.push(packet);
    });

    this.socket.on('move', (packet) => {
      console.log('receiving sprite');
      callbacks.move(packet);
    });

    this.socket.on('settings', (packet) => {
      console.log('settings changed');
      callbacks.settings(packet);
    });
  }

  // Disconnect from current server:
  disconnect() {
    if (!this.socket) {
      console.log('not connected');
      return;
    }
    console.log('disconnecting');
    this.active = false;
    this.socket.disconnect(); // only matters if active
    this.socket = null;
  }

  // Host new server with id:
  host(id, hostname, callbacks) {
    console.log('hosting:', id);
    if (this.socket) {
      console.log('already connected');
      callbacks.failure('Already connected to server.');
      return;
    }
    this.active = false;
    this.hostname = hostname;
    this.connect(callbacks);
    this.socket.emit('host', {id: id});
  }

  // Join existing server with id:
  join(id, hostname, callbacks) {
    console.log('joining:', id);
    if (this.socket) {
      console.log('already connected');
      callbacks.failure('Already connected to server.');
      return;
    }
    this.active = false;
    this.hostname = hostname;
    this.connect(callbacks);
    this.socket.emit('join', {id: id});
  }

  // Pushes the current map to all guests:
  push(map) {
    console.log('pushing map');
    if (!this.socket) {
      console.log('not connected');
      return;
    }
    this.socket.emit('push', map);
  }

  move(sprite) {
    console.log('moving sprite:', sprite.id);
    if (!this.socket) {
      console.log('not connected');
      return;
    }
    this.socket.emit('move', sprite);
  }

  changeSettings(settings) {
    console.log('changing settings:', settings);
    if (!this.socket) {
      console.log('not connected');
      return;
    }
    this.socket.emit('settings', settings);
  }

  log() {
    if (!this.socket) {
      console.log('not connected');
      return;
    }
    this.socket.emit('log');
  }

}