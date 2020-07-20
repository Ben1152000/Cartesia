const scale = 128; // size of cell in pixels
let zTop = 10; // highest z-index

let grid;
let gridDimensions;

let map = {
  width: 0,
  height: 0,
  tiles: [],
  sprites: {}
}

function startup() {
  grid = document.getElementById("grid");
  gridDimensions = {rows: 0, columns: 0};
  loadMapFile("assets/maps/sample.json");
}

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

function render() {
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
      cell.classList.add("grid-item")
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
    image.classList.add("sprite");
    image.classList.add("sprite-tile");
    image.classList.add("crispy");
    image.src = tile.source;
    image.width = parseInt(tile.width * scale);
    image.height = parseInt(tile.height * scale);
    image.style.zIndex = zTop++;
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
    image.classList.add("sprite-mobile");
    image.classList.add("crispy");
    image.src = sprite.source;
    image.width = parseInt(sprite.width * scale);
    image.height = parseInt(sprite.height * scale);
    image.style.zIndex = zTop++;
    makeDraggable(image);
    cell.appendChild(image);
  }
}

/**
 * This function encapsulates the behavior of draggable sprites.
 */
function makeDraggable(element) { // https://www.w3schools.com/howto/howto_js_draggable.asp
  var position = { left: 0, top: 0 }
  element.onmousedown = dragMouseDown;

  function dragMouseDown(event) {
    event = event || window.event;
    event.preventDefault();
    position.left = event.clientX; // get the mouse cursor position at startup
    position.top = event.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag; // call a function whenever the cursor moves
    element.style.zIndex = zTop++; // move element to front
  }

  function elementDrag(event) {
    event = event || window.event;
    event.preventDefault();
    var displacement = { // calculate the new cursor position
      left: position.left - event.clientX, 
      top: position.top - event.clientY
    }
    position.left = event.clientX;
    position.top = event.clientY;
    element.style.left = (element.offsetLeft - displacement.left) + "px";
    element.style.top = (element.offsetTop - displacement.top) + "px";
  }

  function closeDragElement() {
    var gridCoords = getGridCoords(element.getBoundingClientRect());
    var column = Math.max(0, Math.min(Math.round(gridCoords.left), map.width - 1));
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