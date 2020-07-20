const scale = 128; // size of cell in pixels
let zTop = 10; // highest z-index

let grid;
let gridDimensions;

function startup() {
  grid = document.getElementById("grid");
  gridDimensions = {rows: 0, columns: 0};
}

function getGridCoords(position) {
  return {
    left: (grid.scrollLeft + position.left - grid.offsetLeft) / scale,
    top: (grid.scrollTop + position.top - grid.offsetTop) / scale
  };
}

function getGridCell(gridCoords) {
  if (gridCoords.left < 0) 
    gridCoords.left = 0;
  if (gridCoords.left >= gridDimensions.columns) 
    gridCoords.left = gridDimensions.columns - 1;
  if (gridCoords.top < 0) 
    gridCoords.top = 0;
  if (gridCoords.top >= gridDimensions.rows) 
    gridCoords.top = gridDimensions.rows - 1;
  var gridCell = document.getElementById(
    "cell-" + 
    parseInt(Math.floor(gridCoords.top)) + "-" + 
    parseInt(Math.floor(gridCoords.left))
  )
  return gridCell;
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
    gridCoords.left += 0.5; gridCoords.top += 0.5;
    getGridCell(gridCoords).appendChild(element); // move element to new cell
    element.style.left = "-1px"; // reset sprite position
    element.style.top = "-1px";
    document.onmouseup = null;
    document.onmousemove = null;
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

function addSprite(source, column, row, width, height, foreground) {
  var cell = document.getElementById("cell-" + parseInt(row) + "-" + parseInt(column));
  if (cell) {
    var image = document.createElement("IMG");
    image.classList.add("sprite");
    if (foreground) image.classList.add("sprite-mobile");
    image.classList.add("crispy");
    image.src = source;
    image.width = parseInt(width * scale);
    image.height = parseInt(height * scale);
    image.style.zIndex = zTop++;
    if (foreground) makeDraggable(image);
    else makeNonDraggable(image);
    cell.appendChild(image);
  }
}

function resizeGrid(rows, columns) {
  gridDimensions.rows = rows;
  gridDimensions.columns = columns;
  grid.style.gridTemplateColumns = (parseInt(scale) + "px ").repeat(columns);
  grid.style.gridTemplateRows = (parseInt(scale) + "px ").repeat(rows);
  var i;
  for (row = 0; row < rows; row++) {
    for (column = 0; column < columns; column++) {
      var cell = document.createElement("DIV");
      cell.id = "cell-" + parseInt(row) + "-" + parseInt(column);
      cell.classList.add("grid-item")
      cell.innerHTML = parseInt(columns * row + column);
      grid.appendChild(cell);
    }
  }
}

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