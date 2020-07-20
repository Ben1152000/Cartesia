const scale = 128; // size of cell in pixels
let zTop = 10; // highest z-index
let grid;

function startup() {
  grid = document.getElementById("grid");
}

function getGridPosition(event) {
  var relativePosition = {
    left: (grid.scrollLeft + event.pageX - grid.offsetLeft) / scale,
    top: (grid.scrollTop + event.pageY - grid.offsetTop) / scale
  };
  console.log(relativePosition);
  return relativePosition;
}

function resizeGrid(rows, columns) {
  grid.style.gridTemplateColumns = (parseInt(scale) + "px ").repeat(columns);
  grid.style.gridTemplateRows = (parseInt(scale) + "px ").repeat(rows);
  var i;
  for (row = 0; row < rows; row++) {
    for (column = 0; column < columns; column++) {
      var cell = document.createElement("DIV");
      cell.id = "cell-" + parseInt(row) + "-" + parseInt(column);
      cell.classList.add("grid-item")
      /*cell.addEventListener("mouseover", function(event){ 
        if (highlighting) {
          if (event.target !== this) return;
          this.classList.add("highlighted");
        }
      });
      cell.addEventListener("mouseout", function(event){
        if (highlighting) {
          if (event.target !== this) return;
          this.classList.remove("highlighted");
        }
      })*/
      cell.innerHTML = parseInt(columns * row + column);
      grid.appendChild(cell);
    }
  }

  grid.addEventListener("mousemove", getGridPosition);
}

function makeDraggable(element) {
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
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

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

function addBackgroundSprite(source, column, row, width, height, mobile) {
  var cell = document.getElementById("cell-" + parseInt(row) + "-" + parseInt(column));
  if (cell) {
    var image = document.createElement("IMG");
    image.classList.add("sprite");
    if (mobile) image.classList.add("sprite-mobile");
    image.classList.add("crispy");
    image.src = source;
    image.width = parseInt(width * scale);
    image.height = parseInt(height * scale);
    image.style.zIndex = zTop++;
    if (mobile) makeDraggable(image);
    else makeNonDraggable(image);
    cell.appendChild(image);
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
        addBackgroundSprite(sprite.source, sprite.left, sprite.top, sprite.width, sprite.height, false);
      })
      mapData.foreground.sprites.forEach(function(sprite) { 
        console.log(sprite); 
        addBackgroundSprite(sprite.source, sprite.left, sprite.top, sprite.width, sprite.height, true);
      })
    }
  }
}