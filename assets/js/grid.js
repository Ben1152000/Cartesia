const scale = 128; // size of cell in pixels

// This class encapsulates the functionality of the interactive map grid
export class Grid {

  constructor(movementCallback) {
    this.gridElement = document.getElementById("grid");
    this.settings = {
      editing: false
    };
    // movementCallback runs when a sprite is moved, passing the moved object
    this.movementCallback = movementCallback;
    this.map = {
      name: null,
      width: 0,
      height: 0,
      tiles: {},
      sprites: {}
    };
  }

  // map is actually a wrapper around mapData, where setting it calls render
  set map(data) {
    this.mapData = data;
    this.render();
  }

  get map() {
    return this.mapData
  }

  clear() {
    this.gridElement.querySelectorAll('*').forEach(node => node.remove());
  }

  render() {
    console.log('rendering map');
    this.clear();
    this.renderGrid(this.map.width, this.map.height);
    for (var id in this.map.tiles) {
      this.renderTile(this.map.tiles[id], id);
    }
    for (var id in this.map.sprites) {
      this.renderSprite(this.map.sprites[id], id);
    }
  }

  renderGrid() {
    this.gridElement.style.gridTemplateColumns = (parseInt(scale) + "px ").repeat(this.map.width);
    this.gridElement.style.gridTemplateRows = (parseInt(scale) + "px ").repeat(this.map.height);
    for (var row = 0; row < this.map.height; row++) {
      for (var column = 0; column < this.map.width; column++) {
        var cell = document.createElement("DIV");
        cell.id = "cell-" + parseInt(row) + "-" + parseInt(column);
        cell.classList.add("cell")
        cell.innerHTML = parseInt(this.map.width * row + column);
        this.gridElement.appendChild(cell);
      }
    }
  }

  // Gets grid coordinates on the map based on screen position.
  getGridCoords(position) {
    return {
      left: (this.gridElement.scrollLeft + position.left - this.gridElement.offsetLeft) / scale,
      top: (this.gridElement.scrollTop + position.top - this.gridElement.offsetTop) / scale
    };
  }

  renderTile(tile, id) {
    var cell = document.getElementById(
      "cell-" + parseInt(tile.top) + "-" + parseInt(tile.left)
    );
    if (cell) {
      var image = document.createElement("IMG");
      image.id = id;
      image.classList.add("tile");
      image.classList.add("crispy");
      // Check if source is external image:
      if (tile.source.startsWith('http:')) image.src = tile.source;
      else if (tile.source.startsWith('https:')) image.src = tile.source;
      else image.src = 'assets/images/tiles/' + tile.source;
      image.width = parseInt(tile.width * scale);
      image.height = parseInt(tile.height * scale);
      if (tile.flip) {
        if (tile.rotate === 0) image.classList.add('flip');
        if (tile.rotate) image.classList.add('rotate-' + parseInt(tile.rotate) + '-flip');
      } else {
        if (tile.rotate) image.classList.add('rotate-' + parseInt(tile.rotate));
      }
      this.makeNonDraggable(image);
      cell.appendChild(image);
    }
  }

  renderSprite(sprite, id) {
    var cell = document.getElementById(
      "cell-" + parseInt(sprite.top) + "-" + parseInt(sprite.left)
    );
    if (cell) {
      var image = document.createElement("IMG");
      image.id = id;
      image.classList.add("sprite");
      image.classList.add("crispy");
      if ('color' in sprite) {
        image.classList.add('sprite-frame');
        image.classList.add('frame-' + sprite.color);
      }
      // Check if source is external image:
      if (sprite.source.startsWith('http:')) image.src = sprite.source;
      else if (sprite.source.startsWith('https:')) image.src = sprite.source;
      else image.src = 'assets/images/sprites/' + sprite.source;
      image.width = parseInt(sprite.width * scale);
      image.height = parseInt(sprite.height * scale);
      if (sprite.flip) {
        if (sprite.rotate === 0) image.classList.add('flip');
        if (sprite.rotate) image.classList.add('rotate-' + parseInt(sprite.rotate) + '-flip');
      } else {
        if (sprite.rotate) image.classList.add('rotate-' + parseInt(sprite.rotate));
      }
      this.makeDraggable(image);
      cell.appendChild(image);
    }
  }

  replaceSprite(sprite, id) {
    if (id in this.map.sprites) document.getElementById(id).remove();
    this.map.sprites[id] = sprite;
    this.renderSprite(sprite, id);
  }

  toggleEditing(callback) {
    this.settings.editing = !this.settings.editing;
    callback();
  }

  // This function encapsulates the behavior of draggable sprites.
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
      var row = Math.max(0, Math.min(Math.round(gridCoords.top), grid.map.height - Math.round(element.height / scale)));
      grid.map.sprites[element.id].left = column;
      grid.map.sprites[element.id].top = row;
      document.onmouseup = null;
      document.onmousemove = null;
      grid.replaceSprite(grid.map.sprites[element.id], element.id);
      grid.movementCallback({
        id: element.id,
        sprite: grid.map.sprites[element.id]
      });
    }
  }

  // This function encapsulates the behavior of non-draggable sprites.
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

  // Downloads current map as a json file.
  downloadMapFile(failureCallback) {
    if (this.map.name) {
      var mapData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.map));
      var virtualNode = document.createElement('A');
      virtualNode.setAttribute("href", mapData);
      virtualNode.setAttribute("download", this.map.name + ".json");
      document.body.appendChild(virtualNode); // required for firefox
      virtualNode.click();
      virtualNode.remove();
    } else {
      failureCallback();
    }
  }

  // Uploads json file to the current map.
  uploadMapFile(successCallback, failureCallback) {
    // https://stackoverflow.com/questions/23344776/access-data-of-uploaded-json-file-using-javascript
    var reader = new FileReader();
    reader.onload = (event) => {
      try {
        console.log('uploading new map');
        this.map = JSON.parse(event.target.result);
        successCallback();
      } catch (exception) {
        failureCallback();
      }
    };
    reader.readAsText(event.target.files[0]);
  }

  // Loads map json file from filepath. (deprecated)
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