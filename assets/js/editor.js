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
      let element = $('<div id="' + tile.id + '" class="tile-edit"></div>');
      element.data('type', 'tile');

      let image = $('<img class="crispy transform"></img>');
      image.attr('src', tile.source.startsWith("external:")? 
          tile.source.substr(9): ("assets/images/tiles/" + tile.source));
      image.attr('width', parseInt(tile.width * scale));
      image.attr('height', parseInt(tile.height * scale));
      if (tile.flip) {
        if (tile.rotate === 0) image.addClass('flip');
        if (tile.rotate) image.addClass('rotate-' + parseInt(tile.rotate) + '-flip');
      } else {
        if (tile.rotate) image.addClass('rotate-' + parseInt(tile.rotate));
      }
      element.append(image);

      this.makeDraggable(element);
      this.attachTileMenu(element);
      cell.append(element);
    }
  }

  renderSprite(sprite) {
    let cell = $('#cell-' + parseInt(sprite.top) + "-" + parseInt(sprite.left));
    if (cell) {
      let element = $('<div id="' + sprite.id + '" class="sprite"></div>');
      element.data('type', 'sprite');

      let image = $('<img class="crispy transform"></img>');
      image.attr('src', sprite.source.startsWith("external:")? 
          sprite.source.substr(9): ("assets/images/sprites/" + sprite.source));
      image.attr('width', parseInt(sprite.width * scale));
      image.attr('height', parseInt(sprite.height * scale));
      if (sprite.flip) {
        if (sprite.rotate === 0) image.addClass('flip');
        if (sprite.rotate) image.addClass('rotate-' + parseInt(sprite.rotate) + '-flip');
      } else {
        if (sprite.rotate) image.addClass('rotate-' + parseInt(sprite.rotate));
      }
      element.append(image);

      this.makeDraggable(element);
      this.attachSpriteMenu(element);
      cell.append(element);
    }
  }

  attachTileMenu(element) {
    let menu = $('<div class="sprite-menu"></div>');

    let flipButton = $('<button class="btn btn-info sprite-menu-button ml-1">'
        + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrows-collapse" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8zm6-7a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V1.5A.5.5 0 0 1 8 1z"/>'
        + '<path fill-rule="evenodd" d="M10.354 3.646a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L8 5.293l1.646-1.647a.5.5 0 0 1 .708 0zM8 15a.5.5 0 0 0 .5-.5V10a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5z"/>'
        + '<path fill-rule="evenodd" d="M10.354 12.354a.5.5 0 0 0 0-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 .708.708L8 10.707l1.646 1.647a.5.5 0 0 0 .708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(flipButton, () => { this.flipTile(element.attr('id')); });
    menu.append(flipButton);

    let rotateButton = $('<button class="btn btn-info sprite-menu-button ml-1">' 
        + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-clockwise" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M3.17 6.706a5 5 0 0 1 7.103-3.16.5.5 0 1 0 .454-.892A6 6 0 1 0 13.455 5.5a.5.5 0 0 0-.91.417 5 5 0 1 1-9.375.789z"/>'
        + '<path fill-rule="evenodd" d="M8.147.146a.5.5 0 0 1 .707 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 1 1-.707-.708L10.293 3 8.147.854a.5.5 0 0 1 0-.708z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(rotateButton, () => { this.rotateTile(element.attr('id')); });
    menu.append(rotateButton);

    let deleteButton = $('<button class="btn btn-danger sprite-menu-button ml-1">'
        + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"/>'
        + '<path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(deleteButton, () => { this.deleteTile(element.attr('id')); });
    menu.append(deleteButton);

    element.append(menu);
  }

  attachSpriteMenu(element) {
    let menu = $('<div class="sprite-menu"></div>');

    let flipButton = $('<button class="btn btn-info sprite-menu-button ml-1">'
        + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrows-collapse" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8zm6-7a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V1.5A.5.5 0 0 1 8 1z"/>'
        + '<path fill-rule="evenodd" d="M10.354 3.646a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L8 5.293l1.646-1.647a.5.5 0 0 1 .708 0zM8 15a.5.5 0 0 0 .5-.5V10a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5z"/>'
        + '<path fill-rule="evenodd" d="M10.354 12.354a.5.5 0 0 0 0-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 .708.708L8 10.707l1.646 1.647a.5.5 0 0 0 .708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(flipButton, () => { this.flipSprite(element.attr('id')); });
    menu.append(flipButton);

    let rotateButton = $('<button class="btn btn-info sprite-menu-button ml-1">' 
        + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-clockwise" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M3.17 6.706a5 5 0 0 1 7.103-3.16.5.5 0 1 0 .454-.892A6 6 0 1 0 13.455 5.5a.5.5 0 0 0-.91.417 5 5 0 1 1-9.375.789z"/>'
        + '<path fill-rule="evenodd" d="M8.147.146a.5.5 0 0 1 .707 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 1 1-.707-.708L10.293 3 8.147.854a.5.5 0 0 1 0-.708z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(rotateButton, () => { this.rotateSprite(element.attr('id')); });
    menu.append(rotateButton);

    let deleteButton = $('<button class="btn btn-danger sprite-menu-button ml-1">'
        + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"/>'
        + '<path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(deleteButton, () => { this.deleteSprite(element.attr('id')); });
    menu.append(deleteButton);

    element.append(menu);
  }

  flipTile(id) {
    this.map.tiles[id].flip = !this.map.tiles[id].flip;
    this.replaceTile(this.map.tiles[id]);
  }

  flipSprite(id) {
    this.map.sprites[id].flip = !this.map.sprites[id].flip;
    this.replaceSprite(this.map.sprites[id]);
  }

  rotateTile(id) {
    this.map.tiles[id].rotate = (this.map.tiles[id].rotate + 1) % 4;
    this.replaceTile(this.map.tiles[id]);
  }

  rotateSprite(id) {
    this.map.sprites[id].rotate = (this.map.sprites[id].rotate + 1) % 4;
    this.replaceSprite(this.map.sprites[id]);
  }

  deleteTile(id) {
    delete this.map.tiles[id];
    $('#' + id).remove();
  }

  deleteSprite(id) {
    delete this.map.sprites[id];
    $('#' + id).remove();
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
        let sprite;
        if (element.data('type') === 'tile') {
          sprite = this.map.tiles[element.attr('id')];
        } else if (element.data('type') === 'sprite') {
          sprite = this.map.sprites[element.attr('id')];
        } else {
          console.log('Invalid element type');
        }
        let width = (sprite.rotate % 2)? sprite.height: sprite.width;
        let height = (sprite.rotate % 2)? sprite.width: sprite.height;
        let column = Math.max(0, Math.min(Math.round(coords.left), this.map.width - width));
        let row = Math.max(0, Math.min(Math.round(coords.top), this.map.height - height));
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

  makeClickable(element, callback) {
    element.on('mousedown', (event) => {
      event = event || window.event;
      event.stopPropagation();
      element.on('mouseup', (event) => {
        event = event || window.event;
        event.preventDefault();
        element.off('mouseup');
        callback();
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