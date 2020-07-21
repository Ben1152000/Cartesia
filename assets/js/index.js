const scale = 128; // size of cell in pixels

let grid;
let welcome;

let map = {
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
 * Load map json file.
 * https://stackoverflow.com/questions/23344776/access-data-of-uploaded-json-file-using-javascript
 */
function onChange(event) {
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event){
  console.log(event.target.result);
  try {
    map = JSON.parse(event.target.result);
    render();
  } catch (exception) {
    alert("Invalid json file.");
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

/*
function loadMapFile(mapFile) {
  var request = new XMLHttpRequest();
  request.open("GET", mapFile);
  request.send(null);
  request.onreadystatechange = function() {
    if ( request.readyState === 4 && request.status === 200 ) {
      var mapData = JSON.parse(request.responseText);
      resizeGrid(mapData.width, mapData.height);
      mapData.background.sprites.forEach(function(sprite) { 
        console.log(sprite); 
        addSprite(sprite.source, sprite.left, sprite.top, sprite.width, sprite.height, false);
      })
      mapData.foreground.sprites.forEach(function(sprite) { 
        console.log(sprite); 
        addSprite(sprite.source, sprite.left, sprite.top, sprite.width, sprite.height, true);
      })
    }
  }
}
*/