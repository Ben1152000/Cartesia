// global scale const:
const scale = 128;

function resizeGrid(rows, columns) {
  var grid = document.getElementById("grid");
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
  loadMapFile("assets/maps/sample.json");
}

function addBackgroundSprite(source, column, row, width, height) {
  var cell = document.getElementById("cell-" + parseInt(row) + "-" + parseInt(column));
  if (cell) {
    var image = document.createElement("IMG");
    image.classList.add("background-sprite");
    image.classList.add("crispy");
    image.src = source;
    image.width = parseInt(width * scale);
    image.height = parseInt(height * scale);
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
      console.log(mapData.background.sprites.forEach(function(sprite) { 
        console.log(sprite); 
        addBackgroundSprite(sprite.name, sprite.left, sprite.top, sprite.width, sprite.height);
      }))
    }
  }
}