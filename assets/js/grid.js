const scale = 128; // size of cell in pixels

let grid;
let welcome;

let map = {
  name: null,
  width: 0,
  height: 0,
  tiles: [],
  sprites: {}
}

function startup() {
  grid = document.getElementById("grid");
  welcome = document.getElementById("welcome");
  //loadMapFile("assets/maps/sample.json");
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
    map = JSON.parse(event.target.result);
    render();
  } catch (exception) {
    alert("Invalid json file.");
  }
}

/**
 * Download map json file.
 */
function downloadMapFile() {
  if (map.name) {
    var mapData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(map));
    var virtualNode = document.createElement('A');
    virtualNode.setAttribute("href", mapData);
    virtualNode.setAttribute("download", map.name + ".json");
    document.body.appendChild(virtualNode); // required for firefox
    virtualNode.click();
    virtualNode.remove();
  } else {
    //alert("No map file loaded.");
    displayAlertWindow("Error", "No map file is loaded.");
  }
}

/**
 * Load map json file from filepath.
 */
function loadMapFile(mapFile) {
  var request = new XMLHttpRequest();
  request.open("GET", mapFile);
  request.send(null);
  request.onreadystatechange = function() {
    if ( request.readyState === 4 && request.status === 200 ) {
      map = JSON.parse(request.responseText);
      render();
    }
  }
}

/*function renderFailure() {
  var message = document.createElement("")
  grid.
}*/

function refresh() {
  grid.querySelectorAll('*').forEach(node => node.remove());
  grid.setAttribute("hidden", "");
  welcome.removeAttribute("hidden");
}

function render() {
  welcome.setAttribute("hidden", "");
  grid.removeAttribute("hidden");
  grid.querySelectorAll('*').forEach(node => node.remove());
  renderGrid(map.width, map.height);
  map.tiles.forEach(renderTile);
  for(var id in map.sprites) { 
    var sprite = map.sprites[id];
    sprite.id = id;
    renderSprite(sprite);
  }
}

function renderGrid() {
  grid.style.gridTemplateColumns = (parseInt(scale) + "px ").repeat(map.width);
  grid.style.gridTemplateRows = (parseInt(scale) + "px ").repeat(map.height);
  for (row = 0; row < map.height; row++) {
    for (column = 0; column < map.width; column++) {
      var cell = document.createElement("DIV");
      cell.id = "cell-" + parseInt(row) + "-" + parseInt(column);
      cell.classList.add("cell")
      cell.innerHTML = parseInt(map.width * row + column);
      grid.appendChild(cell);
    }
  }
}

/**
 * Get map grid coordinates from screen position.
 */
function getGridCoords(position) {
  return {
    left: (grid.scrollLeft + position.left - grid.offsetLeft) / scale,
    top: (grid.scrollTop + position.top - grid.offsetTop) / scale
  };
}

function renderTile(tile) {
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
    makeNonDraggable(image);
    cell.appendChild(image);
  }
}

function renderSprite(sprite) {
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
    makeDraggable(image);
    cell.appendChild(image);
  }
}

/**
 * This function encapsulates the behavior of draggable sprites.
 */
function makeDraggable(element) { // https://www.w3schools.com/howto/howto_js_draggable.asp
  var initial;
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
    var gridCoords = getGridCoords(element.getBoundingClientRect());
    var column = Math.max(0, Math.min(Math.round(gridCoords.left), map.width - Math.round(element.width / scale)));
    var row = Math.max(0, Math.min(Math.round(gridCoords.top), map.height - 1));
    map.sprites[element.id].left = column;
    map.sprites[element.id].top = row;
    document.onmouseup = null;
    document.onmousemove = null;
    render();
  }
}

/**
 * This function encapsulates the behavior of non-draggable sprites.
 */
function makeNonDraggable(element) {
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

function displayAlertWindow(title, message) {
  document.getElementById("modal-alert-title").innerText = title;
  document.getElementById("modal-alert-message").innerText = message;
  document.getElementById("launch-modal-alert").click();
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
      socket.on('join', function(packet){
        console.log('join:', packet);
      });
      socket.on('send', function(packet){
        console.log('send:', packet);
      });
      callbacks.success();
    });

    socket.on('host-failure', function(packet){
      console.log('error:', packet.message);
      Io.disconnect();
      callbacks.failure(packet.message);
    });

    socket.on('join', function(packet){
      console.log('guest joined');
      Io.push();
    });

    socket.on('join-success', function(packet){
      console.log('joined server:', packet.id);
      socket.on('push', function(packet){
        console.log('push:', packet);
      });
      socket.on('send', function(packet){
        console.log('send:', packet);
      });
      callbacks.success();
    });

    socket.on('join-failure', function(packet){
      console.log('error:', packet.message);
      Io.disconnect();
      callbacks.failure(packet.message);
    });

    socket.on('close', function(packet){
      console.log('server closed');
      Io.disconnect();
    });

    socket.on('push', function(packet){
      console.log('receiving map');
      callbacks.push(packet);
    })
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
  static push() {
    console.log('pushing map');
    if (!socket) {
      console.log('not connected');
      return;
    }
    socket.emit('push', map);
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

  document.getElementById('button-modal-input').addEventListener('click', attemptConnection);
  document.getElementById('launch-modal-input').click();

  $('#modal-input').on('hidden.bs.modal', function (e) {
    document.getElementById('button-modal-input').removeEventListener('click', attemptConnection);
    document.getElementById('modal-input-alert').setAttribute('hidden', '');
  })

  function attemptConnection(event) {
    event.preventDefault();
    var value = parseInt(document.getElementById('input-modal-input').value);

    if (type === "host") { 
      Io.host(value, {
        success: success,
        failure: failure
      }); 
    }
    else if (type === "guest") { 
      Io.join(value, {
        success: success,
        failure: failure,
        push: receive
      }); 
    }
  }

  function failure(message) {
    var alert = document.getElementById('modal-input-alert');
    alert.removeAttribute('hidden');
    alert.innerText = message;
  }

  function success() {
    $('#modal-input').modal('hide');
    render();
  }

  function receive(packet) {
    map = packet;
    render()
  }
}
