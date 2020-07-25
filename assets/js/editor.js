const scale = 128; // size of cell in pixels

// This class encapsulates the functionality of the interactive map grid
export class Editor {

  constructor() {
    this.gridElement = document.getElementById("grid");
    this.grid = $('#grid');
    this.reset();
  }

  // map is actually a wrapper around mapData, where setting it calls render
  set map(data) {
    this.mapData = data;
    this.render();
  }

  get map() {
    return this.mapData
  }

  reset() {
    this.map = {
      name: null,
      width: 0,
      height: 0,
      tiles: [],
      sprites: {}
    };
  }

  clear() {
    this.gridElement.querySelectorAll('*').forEach(node => node.remove());
  }

  render() {
    console.log('rendering map');
    this.clear();
    this.renderGrid();
    for (var id in this.map.tiles) {
      let tile = this.map.tiles[id];
      tile.id = id;
      this.renderTile(this.map.tiles[id]);
    }
    for (var id in this.map.sprites) { 
      let sprite = this.map.sprites[id];
      sprite.id = id;
      this.renderSprite(sprite);
    }
  }

  renderGrid() {
    this.grid.css({
      gridTemplateColumns: (parseInt(scale) + "px ").repeat(this.map.width),
      gridTemplateRows: (parseInt(scale) + "px ").repeat(this.map.height)
    });
    for (var row = 0; row < this.map.height; row++) {
      for (var column = 0; column < this.map.width; column++) {
        this.grid.append($("<div id=\"cell-" + parseInt(row) + "-" + parseInt(column) + "\" class=\"cell\">"
              + parseInt(this.map.width * row + column) + "</div>"));
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

  renderTile(tile) {
    let cell = $('#cell-' + parseInt(tile.top) + "-" + parseInt(tile.left));
    if (cell) {
      let element = $('<img id="' + tile.id + '" class="tile-edit crispy"></div>');
      element.data('type', 'tile');
      element.attr('src', tile.source.startsWith("external:")? 
          tile.source.substr(9): ("assets/images/tiles/" + tile.source));
      element.attr('width', parseInt(tile.width * scale));
      element.attr('height', parseInt(tile.height * scale));
      if (tile.rotate) element.addClass("rotate-" + parseInt(tile.rotate));
      if (tile.flip) element.addClass("flip");
      this.makeDraggable(element);
      cell.append(element);
    }
  }

  renderSprite(sprite) {
    let cell = $('#cell-' + parseInt(sprite.top) + "-" + parseInt(sprite.left));
    if (cell) {
      let element = $('<img id="' + sprite.id + '" class="sprite crispy"></div>');
      element.data('type', 'sprite');
      element.attr('src', sprite.source.startsWith("external:")? 
          sprite.source.substr(9): ("assets/images/sprites/" + sprite.source));
      element.attr('width', parseInt(sprite.width * scale));
      element.attr('height', parseInt(sprite.height * scale));
      if (sprite.rotate) element.addClass("rotate-" + parseInt(sprite.rotate));
      if (sprite.flip) element.addClass("flip");
      this.makeDraggable(element);
      this.attachMenu(element);
      cell.append(element);
    }
  }

  attachMenu(element) {
    let menu = $('<p>menu</p>');
    element.append(menu);
  }

  replaceTile(tile) {
    this.map.tiles[tile.id] = tile;
    $('#' + tile.id).remove();
    this.renderTile(tile);
  }

  replaceSprite(sprite) {
    this.map.sprites[sprite.id] = sprite;
    $('#' + sprite.id).remove();
    this.renderSprite(sprite);
  }

  // This function encapsulates the behavior of draggable sprites.
  makeDraggable(element) { // https://www.w3schools.com/howto/howto_js_draggable.asp
    let initial;

    element.on('mousedown', (event) => {
      event = event || window.event;
      event.preventDefault();
      initial = {left: event.clientX + 1, top: event.clientY + 1};

      $(document).on('mousemove', (event) => {
        event = event || window.event;
        event.preventDefault();
        element.css({
          left: (event.clientX - initial.left) + "px", 
          top: (event.clientY - initial.top) + "px"
        });
      });

      $(document).on('mouseup', (event) => {
        let coords = this.getGridCoords(element.offset());
        let column = Math.max(0, Math.min(Math.round(coords.left), 
            this.map.width - Math.round(element.attr('width') / scale)));
        let row = Math.max(0, Math.min(Math.round(coords.top), 
            this.map.height - Math.round(element.attr('height') / scale)));
        $(document).off('mouseup');
        $(document).off('mousemove');
        if (element.data('type') === 'tile') {
          this.map.tiles[element.attr('id')].left = column;
          this.map.tiles[element.attr('id')].top = row;
          this.replaceTile(this.map.tiles[element.attr('id')]);
        } else if (element.data('type') === 'sprite') {
          this.map.sprites[element.attr('id')].left = column;
          this.map.sprites[element.attr('id')].top = row;
          this.replaceSprite(this.map.sprites[element.attr('id')]);
        } else {
          console.log('Invalid element type');
        }
      });

    });
  }

  // Downloads current map as a json file.
  download(failureCallback) {
    if (this.map.name) {
      let mapData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.map));
      let virtualNode = $('<a id="virtual-node" href="' + mapData + '" download="' + this.map.name + '.json"></a>');
      $(document.body).append(virtualNode);
      virtualNode[0].click();
      virtualNode.remove();
    } else {
      failureCallback();
    }
  }

  // Uploads json file to the current map.
  upload(successCallback, failureCallback) {
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

}