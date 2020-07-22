

let gridElement;
let grid;

function startup() {
  gridElement = document.getElementById("grid");
  document.getElementById('file-upload').addEventListener('change', onChange);
}

/**
 * Upload map json file.
 * https://stackoverflow.com/questions/23344776/access-data-of-uploaded-json-file-using-javascript
 */
function onChange(event) {
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event){
  try {
    grid = new Grid();
    var map = JSON.parse(event.target.result);
    grid.setMap(map);
  } catch (exception) {
    displayAlertWindow('Error', "Invalid json file.");
  }

}

const scale = 128; // size of cell in pixels

class Grid {

  constructor() {
    this.settings = {
      editing: false
    };
    this.setMap({
      name: null,
      width: 0,
      height: 0,
      tiles: [],
      sprites: {}
    });
    this.render();
  }

  setMap(map) {
    this.map = map;
    console.log(map);
    Io.push(map); // push map to others (if not a host, it will be ignored)
    this.render();
  }

  /**
   * setMap, but without push
   */
  receiveMap(map) {
    this.map = map;
    this.render();
  }

  refresh() {
    this.map = {
      name: null,
      width: 0,
      height: 0,
      tiles: [],
      sprites: {}
    };
    gridElement.querySelectorAll('*').forEach(node => node.remove());
  }

  render() {
    gridElement.querySelectorAll('*').forEach(node => node.remove());
    this.renderGrid(this.map.width, this.map.height);
    for (var id in this.map.tiles) {
      this.renderTile(this.map.tiles[id]);
    }
    for (var id in this.map.sprites) { 
      var sprite = this.map.sprites[id];
      sprite.id = id;
      this.renderSprite(sprite);
    }
  }

  renderGrid() {
    gridElement.style.gridTemplateColumns = (parseInt(scale) + "px ").repeat(this.map.width);
    gridElement.style.gridTemplateRows = (parseInt(scale) + "px ").repeat(this.map.height);
    for (var row = 0; row < this.map.height; row++) {
      for (var column = 0; column < this.map.width; column++) {
        var cell = document.createElement("DIV");
        cell.id = "cell-" + parseInt(row) + "-" + parseInt(column);
        cell.classList.add("cell")
        cell.innerHTML = parseInt(this.map.width * row + column);
        gridElement.appendChild(cell);
      }
    }
  }

  /**
   * Get map grid coordinates from screen position.
   */
  getGridCoords(position) {
    return {
      left: (gridElement.scrollLeft + position.left - gridElement.offsetLeft) / scale,
      top: (gridElement.scrollTop + position.top - gridElement.offsetTop) / scale
    };
  }

  renderTile(tile) {
    var cell = document.getElementById(
      "cell-" + parseInt(tile.top) + "-" + parseInt(tile.left)
    );
    if (cell) {
      var image = document.createElement("IMG");
      image.classList.add("tile");
      image.classList.add("crispy");
      image.src = "assets/images/tiles/" + tile.source;
      image.width = parseInt(tile.width * scale);
      image.height = parseInt(tile.height * scale);
      if (tile.rotate) image.classList.add("rotate-" + parseInt(tile.rotate));
      if (tile.flip) image.classList.add("flip");
      this.makeNonDraggable(image);
      cell.appendChild(image);
    }
  }

  renderSprite(sprite) {
    var cell = document.getElementById(
      "cell-" + parseInt(sprite.top) + "-" + parseInt(sprite.left)
    );
    if (cell) {
      var image = document.createElement("IMG");
      image.id = sprite.id;
      image.classList.add("sprite");
      image.classList.add("crispy");
      image.src = "assets/images/sprites/" + sprite.source;
      image.width = parseInt(sprite.width * scale);
      image.height = parseInt(sprite.height * scale);
      if (sprite.rotate) image.classList.add("rotate-" + parseInt(sprite.rotate));
      if (sprite.flip) image.classList.add("flip");
      this.makeDraggable(image);
      cell.appendChild(image);
    }
  }

  setSprite(sprite) {
    this.map.sprites[sprite.id] = sprite;
    Io.move(sprite);
    document.getElementById(sprite.id).remove();
    this.renderSprite(sprite);
  }

  /**
   * setSprite, but without move
   */
  replaceSprite(sprite) {
    this.map.sprites[sprite.id] = sprite;
    document.getElementById(sprite.id).remove();
    this.renderSprite(sprite);
  }

  toggleEditing() {
    this.settings.editing = !this.settings.editing;
    Io.changeSettings(this.settings);
  }

  /**
   * This function encapsulates the behavior of draggable sprites.
   */
  makeDraggable(element) { // https://www.w3schools.com/howto/howto_js_draggable.asp
    var initial;
    var grid = this;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(event) {
      event = event || window.event;
      event.preventDefault();
      initial = {left: event.clientX + 1, top: event.clientY + 1};
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag; // call a function whenever the cursor moves
    }

    function elementDrag(event) {
      event = event || window.event;
      event.preventDefault();
      element.style.left = (event.clientX - initial.left) + "px";
      element.style.top = (event.clientY - initial.top) + "px";
    }

    function closeDragElement() {
      var gridCoords = grid.getGridCoords(element.getBoundingClientRect());
      var column = Math.max(0, Math.min(Math.round(gridCoords.left), grid.map.width - Math.round(element.width / scale)));
      var row = Math.max(0, Math.min(Math.round(gridCoords.top), grid.map.height - 1));
      grid.map.sprites[element.id].left = column;
      grid.map.sprites[element.id].top = row;
      document.onmouseup = null;
      document.onmousemove = null;
      grid.setSprite(grid.map.sprites[element.id]);
    }
  }

  /**
   * This function encapsulates the behavior of non-draggable sprites.
   */
  makeNonDraggable(element) {
    element.onmousedown = dragMouseDown;

    function dragMouseDown(event) {
      event = event || window.event;
      event.preventDefault();
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(event) {
      event = event || window.event;
      event.preventDefault();
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  /**
   * Download map json file.
   */
  downloadMapFile() {
    if (this.map.name) {
      var mapData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.map));
      var virtualNode = document.createElement('A');
      virtualNode.setAttribute("href", mapData);
      virtualNode.setAttribute("download", this.map.name + ".json");
      document.body.appendChild(virtualNode); // required for firefox
      virtualNode.click();
      virtualNode.remove();
    } else {
      //alert("No map file loaded.");
      displayAlertWindow("Error", "Cannot download map, no map file is loaded.");
    }
  }

  /**
   * Load map json file from filepath.
   */
  loadMapFile(mapFile) {
    var request = new XMLHttpRequest();
    request.open("GET", mapFile);
    request.send(null);
    request.onreadystatechange = function() {
      if ( request.readyState === 4 && request.status === 200 ) {
        this.map = JSON.parse(request.responseText);
        this.render();
      }
    }
  }

}

////////////////////////////////////////////////////////////////////////////////
//  Socket Funtions:                                                          //
////////////////////////////////////////////////////////////////////////////////

let socket;
let id;

class Io {

  // Connect to socket.io:
  static connect(callbacks) {
    if (socket) {
      console.log('already connected');
      callbacks.failure('Already connected to server.');
      return;
    }
    socket = io();
    console.log('connected');

    socket.on('host-success', function(packet){
      console.log('hosting server:', packet.id);
      callbacks.success(packet.id);
    });

    socket.on('host-failure', function(packet){
      console.log('error:', packet.message);
      Io.disconnect();
      callbacks.failure(packet.message);
    });

    socket.on('join', function(packet){
      console.log('guest joined');
      Io.push(grid.map);
    });

    socket.on('join-success', function(packet){
      console.log('joined server:', packet.id);
      callbacks.success(packet.id);
    });

    socket.on('join-failure', function(packet){
      console.log('error:', packet.message);
      Io.disconnect();
      callbacks.failure(packet.message);
    });

    socket.on('close', function(packet){
      console.log('server closed');
      disconnectFromServer();
      displayAlertWindow('Server Closed', 'You were disconnected from the server.');
    });

    socket.on('push', function(packet){
      console.log('receiving map');
      callbacks.push(packet);
    });

    socket.on('move', function(packet){
      console.log('receiving sprite');
      callbacks.move(packet);
    });
  }

  // Disconnect from current server:
  static disconnect() {
    if (!socket) {
      console.log('not connected');
      return;
    }
    socket.disconnect();
    socket = null;
    console.log('disconnected');
  }

  // Host new server with id:
  static host(id, callbacks) {
    console.log('hosting:', id);
    if (socket) {
      console.log('already connected');
      callbacks.failure('Already connected to server.');
      return;
    }
    Io.connect(callbacks);
    socket.emit('host', {id: id});
  }

  // Join existing server with id:
  static join(id, callbacks) {
    console.log('joining:', id);
    if (socket) {
      console.log('already connected');
      callbacks.failure('Already connected to server.');
      return;
    }
    Io.connect(callbacks);
    socket.emit('join', {id: id});
  }

  // Pushes the current map to all guests:
  static push(map) {
    console.log('pushing map');
    if (!socket) {
      console.log('not connected');
      return;
    }
    socket.emit('push', map);
  }

  static move(sprite) {
    console.log('moving sprite:', sprite.id);
    if (!socket) {
      console.log('not connected');
      return;
    }
    socket.emit('move', sprite);
  }

  static changeSettings(settings) {
    console.log('changing settings:', settings);
    if (!socket) {
      console.log('not connected');
      return;
    }
    socket.emit('settings', settings);
  }

  static log() {
    if (!socket) {
      console.log('not connected');
      return;
    }
    socket.emit('log');
  }

}


////////////////////////////////////////////////////////////////////////////////
//  Button Funtions:                                                          //
////////////////////////////////////////////////////////////////////////////////

function connectToServer(type) {

  document.getElementById('modal-input-submit').addEventListener('click', attemptConnection);
  document.getElementById('modal-input-launch').click();

  $('#modal-input').on('hidden.bs.modal', function (e) {
    document.getElementById('modal-input-submit').removeEventListener('click', attemptConnection);
    document.getElementById('modal-input-alert').setAttribute('hidden', '');
  })

  function attemptConnection(event) {
    event.preventDefault();
    var value = parseInt(document.getElementById('modal-input-form').value);

    if (type === "host") { 
      Io.host(value, {
        success: hostSuccess,
        failure: failure,
        move: receiveMove
      }); 
    }
    else if (type === "guest") { 
      Io.join(value, {
        success: joinSuccess,
        failure: failure,
        push: receivePush,
        move: receiveMove
      }); 
    }
  }

  function failure(message) {
    var alert = document.getElementById('modal-input-alert');
    alert.removeAttribute('hidden');
    alert.innerText = message;
  }

  function hostSuccess(id) {
    $('#modal-input').modal('hide');
    gridElement.removeAttribute("hidden");
    document.getElementById("welcome").setAttribute("hidden", "");
    document.getElementById("host-toolbar").removeAttribute("hidden");
    document.getElementById("guest-toolbar").setAttribute("hidden", "");
    document.getElementById("server-label-host").innerHTML = id;
    grid = new Grid();
  }

  function joinSuccess(id) {
    $('#modal-input').modal('hide');
    gridElement.removeAttribute("hidden");
    document.getElementById("welcome").setAttribute("hidden", "");
    document.getElementById("host-toolbar").setAttribute("hidden", "");
    document.getElementById("guest-toolbar").removeAttribute("hidden");
    document.getElementById("server-label-guest").innerHTML = id;
    grid = new Grid();
  }

  function receivePush(map) {
    grid.receiveMap(map);
  }

  function receiveMove(sprite) {
    grid.replaceSprite(sprite);
  }
}

function disconnectFromServer() {
  Io.disconnect();
  gridElement.setAttribute("hidden", "");
  document.getElementById("host-toolbar").setAttribute("hidden", "");
  document.getElementById("guest-toolbar").setAttribute("hidden", "");
  document.getElementById("welcome").removeAttribute("hidden");
}

function toggleEditing() {
  grid.toggleEditing();
  if (grid.settings.editing) {
    document.getElementById("button-editing").title = "Editing enabled";
    document.getElementById("button-editing-enabled").removeAttribute("hidden");
    document.getElementById("button-editing-disabled").setAttribute("hidden", "");
  } else {
    document.getElementById("button-editing").title = "Editing disabled";
    document.getElementById("button-editing-enabled").setAttribute("hidden", "");
    document.getElementById("button-editing-disabled").removeAttribute("hidden");
  }
}

function displayAlertWindow(title, message) {
  document.getElementById("modal-alert-title").innerText = title;
  document.getElementById("modal-alert-message").innerText = message;
  document.getElementById("launch-modal-alert").click();
}

function displayConfirmLeaveWindow() {
  
  document.getElementById('modal-confirm-submit').addEventListener('click', disconnectFromServer);

  $('#modal-confirm').on('hidden.bs.modal', function (e) {
    document.getElementById('modal-confirm-submit').removeEventListener('click', disconnectFromServer);
  })

  document.getElementById('launch-modal-confirm').click();
}