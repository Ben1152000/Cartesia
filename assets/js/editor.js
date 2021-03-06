const scale = 128; // size of cell in pixels

// This class encapsulates the functionality of the interactive map grid
export class Editor {

  constructor() {
    this.grid = $('#grid');
    this.lastNewElement = null;
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

  // public: reconstruct map with params
  reset(name, width, height) {
    if (typeof name === 'undefined') name = null;
    if (typeof width === 'undefined') width = 0;
    if (typeof height === 'undefined') height = 0;
    this.map = {
      name: name,
      width: width,
      height: height,
      tiles: {},
      sprites: {}
    };
  }

  resize(width, height) {
    this.map.width = width;
    this.map.height = height;
    this.render();
  }

  clear() {
    this.grid.empty();
  }

  render() {
    console.log('rendering map');
    this.clear();
    this.renderGrid();
    for (var id in this.map.tiles) {
      this.renderTile(this.map.tiles[id], id);
    }
    for (var id in this.map.sprites) {
      this.renderSprite(this.map.sprites[id], id);
    }
  }

  renderGrid() {
    this.grid.css({
      gridTemplateColumns: (parseInt(scale) + 'px ').repeat(this.map.width),
      gridTemplateRows: (parseInt(scale) + 'px ').repeat(this.map.height)
    });
    for (var row = 0; row < this.map.height; row++) {
      for (var column = 0; column < this.map.width; column++) {
        let cell = $('<div id="cell-' + parseInt(row) + '-' + parseInt(column) + '" class="cell cell-editor">'
            + parseInt(this.map.width * row + column) + '</div>');
        cell.data('left', parseInt(column)); cell.data('top', parseInt(row));
        cell.on('dblclick', () => { this.cloneElement(this.lastNewElement, cell.data('left'), cell.data('top')); });
        
        
        if (row === 0) {
          let gridline = $('<div class="gridline gridline-vertical"></div>');
          gridline.css({height: this.map.height * scale});
          cell.append(gridline);
          if (column === this.map.width - 1) {
            let endline = $('<div class="gridline gridline-vertical"></div>');
            endline.css({height: this.map.height * scale, left: scale - 2, 'border-left': '0px'});
            cell.append(endline);
          }
        }
        if (column === 0) {
          let gridline = $('<div class="gridline gridline-horizontal"></div>');
          gridline.css({width: this.map.width * scale});
          cell.append(gridline);
          if (row === this.map.height - 1) {
            let endline = $('<div class="gridline gridline-horizontal"></div>');
            endline.css({width: this.map.width * scale, top: scale - 2, 'border-bottom': '0px'});
            cell.append(endline);
          }
        }

        this.grid.append(cell);
      }
    }
  }

  renderTile(tile, id, showMenu) {
    let cell = $('#cell-' + parseInt(tile.top) + "-" + parseInt(tile.left));
    if (cell) {
      let element = $('<div class="tile tile-edit"></div>');
      element.attr('id', id);
      element.data('type', 'tile');
      element.data('id', id);
      element.css({
        width: (tile.rotate % 2)? tile.height * scale + "px": tile.width * scale + "px", 
        height: (tile.rotate % 2)? tile.width * scale + "px": tile.height * scale + "px"
      });
      if ('tile-ordering' in this.map) {
        if (this.map['tile-ordering'].includes(id)) {
          element.css({'z-index': Math.min(499, 2 + this.map['tile-ordering'].indexOf(id))});
        }
      }

      let image = $('<img class="crispy transform"></img>');
      // Check if source is external image:
      if (tile.source.startsWith('http:')) image.attr('src', tile.source);
      else if (tile.source.startsWith('https:')) image.attr('src', tile.source);
      else image.attr('src', 'assets/images/tiles/' + tile.source);
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
      this.attachTileMenu(element, image, showMenu);
      cell.append(element);
    }
  }

  renderSprite(sprite, id, showMenu) {
    let cell = $('#cell-' + parseInt(sprite.top) + "-" + parseInt(sprite.left));
    if (cell) {
      let element = $('<div class="sprite"></div>');
      element.attr('id', id);
      element.data('type', 'sprite');
      element.data('id', id);
      element.css({
        width: (sprite.rotate % 2)? sprite.height * scale + "px": sprite.width * scale + "px", 
        height: (sprite.rotate % 2)? sprite.width * scale + "px": sprite.height * scale + "px"
      });

      let image = $('<img class="crispy transform"></img>');
      if ('color' in sprite) image.addClass('sprite-frame frame-' + sprite.color);
      // Check if source is external image:
      if (sprite.source.startsWith('http:')) image.attr('src', sprite.source);
      else if (sprite.source.startsWith('https:')) image.attr('src', sprite.source);
      else image.attr('src', 'assets/images/sprites/' + sprite.source);
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
      this.attachSpriteMenu(element, image, showMenu);
      cell.append(element);
    }
  }

  attachTileMenu(element, image, showMenu) {
    let menu = $('<div class="sprite-menu" hidden></div>');

    if (showMenu) menu.removeAttr('hidden');

    let flipButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Flip tile">'
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-arrows-collapse" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8zm6-7a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V1.5A.5.5 0 0 1 8 1z"/>'
        + '<path fill-rule="evenodd" d="M10.354 3.646a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L8 5.293l1.646-1.647a.5.5 0 0 1 .708 0zM8 15a.5.5 0 0 0 .5-.5V10a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5z"/>'
        + '<path fill-rule="evenodd" d="M10.354 12.354a.5.5 0 0 0 0-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 .708.708L8 10.707l1.646 1.647a.5.5 0 0 0 .708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(flipButton, () => { this.flipTile(element.data('id')); });
    menu.append(flipButton);

    let rotateButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Rotate tile">' 
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-arrow-clockwise" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M3.17 6.706a5 5 0 0 1 7.103-3.16.5.5 0 1 0 .454-.892A6 6 0 1 0 13.455 5.5a.5.5 0 0 0-.91.417 5 5 0 1 1-9.375.789z"/>'
        + '<path fill-rule="evenodd" d="M8.147.146a.5.5 0 0 1 .707 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 1 1-.707-.708L10.293 3 8.147.854a.5.5 0 0 1 0-.708z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(rotateButton, () => { this.rotateTile(element.data('id')); });
    menu.append(rotateButton);

    let duplicateButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Clone tile">' 
        + '<svg width=".8em" height=".8em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy">'
        + '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>'
        + '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>'
        + '</svg>'
        + '</button>');
    this.makeClickable(duplicateButton, () => { this.cloneElement(element.data('id')); });
    menu.append(duplicateButton);

    let moveToFrontButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Bring tile to front">' 
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-arrow-bar-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M11.354 5.854a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L8 3.207l2.646 2.647a.5.5 0 0 0 .708 0z"/>'
        + '<path fill-rule="evenodd" d="M8 10a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-1 0v6.5a.5.5 0 0 0 .5.5zm-4.8 1.6c0-.22.18-.4.4-.4h8.8a.4.4 0 0 1 0 .8H3.6a.4.4 0 0 1-.4-.4z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(moveToFrontButton, () => { this.moveTileToFront(element.data('id')); });
    menu.append(moveToFrontButton);

    let deleteButton = $('<button class="btn btn-danger sprite-menu-button ml-1" title="Delete tile">'
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"/>'
        + '<path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(deleteButton, () => { this.deleteTile(element.data('id')); });
    menu.append(deleteButton);

    element.on('mouseover', () => { 
      menu.removeAttr('hidden'); 
      image.addClass('tile-select');
    });
    element.on('mouseout', () => { 
      menu.attr('hidden', '');
      image.removeClass('tile-select');
    });

    element.append(menu);
  }

  attachSpriteMenu(element, image, showMenu) {
    let menu = $('<div class="sprite-menu" hidden></div>');

    if (showMenu) menu.removeAttr('hidden');

    let flipButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Flip sprite">'
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-arrows-collapse" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8zm6-7a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V1.5A.5.5 0 0 1 8 1z"/>'
        + '<path fill-rule="evenodd" d="M10.354 3.646a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L8 5.293l1.646-1.647a.5.5 0 0 1 .708 0zM8 15a.5.5 0 0 0 .5-.5V10a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5z"/>'
        + '<path fill-rule="evenodd" d="M10.354 12.354a.5.5 0 0 0 0-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 .708.708L8 10.707l1.646 1.647a.5.5 0 0 0 .708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(flipButton, () => { this.flipSprite(element.data('id')); });
    menu.append(flipButton);

    let rotateButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Rotate sprite">' 
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-arrow-clockwise" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M3.17 6.706a5 5 0 0 1 7.103-3.16.5.5 0 1 0 .454-.892A6 6 0 1 0 13.455 5.5a.5.5 0 0 0-.91.417 5 5 0 1 1-9.375.789z"/>'
        + '<path fill-rule="evenodd" d="M8.147.146a.5.5 0 0 1 .707 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 1 1-.707-.708L10.293 3 8.147.854a.5.5 0 0 1 0-.708z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(rotateButton, () => { this.rotateSprite(element.data('id')); });
    menu.append(rotateButton);

    let duplicateButton = $('<button class="btn btn-info sprite-menu-button ml-1" title="Clone sprite">' 
        + '<svg width=".8em" height=".8em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy">'
        + '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>'
        + '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>'
        + '</svg>'
        + '</button>');
    this.makeClickable(duplicateButton, () => { this.cloneElement(element.data('id')); });
    menu.append(duplicateButton);

    let deleteButton = $('<button class="btn btn-danger sprite-menu-button ml-1" title="Delete sprite">'
        + '<svg width=".8em" height=".8em" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
        + '<path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"/>'
        + '<path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"/>'
        + '</svg>'
        + '</button>');
    this.makeClickable(deleteButton, () => { this.deleteSprite(element.data('id')); });
    menu.append(deleteButton);

    element.on('mouseover', () => { 
      menu.removeAttr('hidden'); 
      image.addClass('sprite-select'); 
    });
    element.on('mouseout', () => { 
      menu.attr('hidden', ''); 
      image.removeClass('sprite-select'); 
    });

    element.append(menu);
  }

  flipTile(id) {
    this.map.tiles[id].flip = !this.map.tiles[id].flip;
    this.replaceTile(this.map.tiles[id], id, true);
  }

  flipSprite(id) {
    this.map.sprites[id].flip = !this.map.sprites[id].flip;
    this.replaceSprite(this.map.sprites[id], id, true);
  }

  rotateTile(id) {
    this.map.tiles[id].rotate = (this.map.tiles[id].rotate + 1) % 4;
    this.replaceTile(this.map.tiles[id], id, true);
  }

  rotateSprite(id) {
    this.map.sprites[id].rotate = (this.map.sprites[id].rotate + 1) % 4;
    this.replaceSprite(this.map.sprites[id], id, true);
  }

  deleteTile(id) {
    if (id in this.map.tiles) {
      this.removeTileFromOrdering(id);
      delete this.map.tiles[id];
      $('#' + id).remove();
    }
  }

  deleteSprite(id) {
    if (id in this.map.sprites) {
      delete this.map.sprites[id];
      $('#' + id).remove();
    }
  }

  // public: replace tile with id
  replaceTile(tile, id, showMenu) {
    if (typeof id === 'undefined') {
      throw 'No tile id was provided';
    } else if (id in this.map.tiles) {
      this.map.tiles[id] = tile;
      $('#' + id).remove();
    } else {
      this.map.tiles[id] = tile;
      if (!('tile-ordering' in this.map)) this.map['tile-ordering'] = [];
      this.map['tile-ordering'].push(id);
    }
    this.lastNewElement = id;
    this.renderTile(tile, id, showMenu);
  }

  // public: replace sprite with id
  replaceSprite(sprite, id, showMenu) {
    if (typeof id === 'undefined') {
      throw 'No sprite id was provided';
    } else if (id in this.map.sprites) {
      this.map.sprites[id] = sprite;
      $('#' + id).remove();
    } else {
      this.map.sprites[id] = sprite;
    }
    this.lastNewElement = id;
    this.renderSprite(sprite, id, showMenu);
  }

  cloneElement(id, left, top) {
    if (id in this.map.tiles) {
      let original = this.map.tiles[id];
      if (typeof left === 'undefined') left = original.left;
      if (typeof top === 'undefined') top = original.top;
      let clone = {
        source: original.source,
        top: top,
        left: left, 
        width: original.width,
        height: original.height,
        flip: original.flip,
        rotate: original.rotate
      };
      this.replaceTile(this.map.tiles[id], id, false);
      this.replaceTile(clone, 'tile-' + Date.now());
    } else if (id in this.map.sprites) {
      let original = this.map.sprites[id];
      if (typeof left === 'undefined') left = original.left;
      if (typeof top === 'undefined') top = original.top;
      let clone = {
        source: original.source,
        top: top,
        left: left, 
        width: original.width,
        height: original.height,
        flip: original.flip,
        rotate: original.rotate
      };
      if ('color' in original) clone.color = original.color;
      this.replaceSprite(this.map.sprites[id], id, false);
      this.replaceSprite(clone, 'sprite-' + Date.now());
    }
  }

  moveTileToFront(id) {
    if (!(id in this.map.tiles)) {
      throw 'Tile id does not exist';
    } else {
      if (!('tile-ordering' in this.map)) this.map['tile-ordering'] = [];
      this.removeTileFromOrdering(id);
      this.map['tile-ordering'].push(id);
    }
    this.render();
  }

  removeTileFromOrdering(id) {
    if ('tile-ordering' in this.map) {
      let index = this.map['tile-ordering'].indexOf(id);
      if (index !== -1)
        this.map['tile-ordering'].splice([index], 1); // remove item
    }
  }

  // This function encapsulates the behavior of draggable sprites.
  makeDraggable(element) { // https://www.w3schools.com/howto/howto_js_draggable.asp
    let initial;

    element.on('mousedown', (event) => {
      event = event || window.event;
      event.preventDefault();
      initial = {left: event.clientX, top: event.clientY};

      $(document).on('mousemove', (event) => {
        event = event || window.event;
        event.preventDefault();
        element.css({
          left: (event.clientX - initial.left) * this.grid.css('--grid-scale') - 1 + "px", 
          top: (event.clientY - initial.top) * this.grid.css('--grid-scale') - 1 + "px"
        });
      });

      $(document).on('mouseup', (event) => {
        let gridElement = document.getElementById("grid");
        let coords = {
          left: (gridElement.scrollLeft + (element.offset().left - gridElement.offsetLeft) * this.grid.css('--grid-scale')) / scale,
          top: (gridElement.scrollTop + (element.offset().top - gridElement.offsetTop) * this.grid.css('--grid-scale')) / scale
        };
        let sprite;
        if (element.data('type') === 'tile') {
          sprite = this.map.tiles[element.data('id')];
        } else if (element.data('type') === 'sprite') {
          sprite = this.map.sprites[element.data('id')];
        } else {
          throw 'Invalid element type';
        }
        let width = (sprite.rotate % 2)? sprite.height: sprite.width;
        let height = (sprite.rotate % 2)? sprite.width: sprite.height;
        let column = Math.max(0, Math.min(Math.round(coords.left), this.map.width - width));
        let row = Math.max(0, Math.min(Math.round(coords.top), this.map.height - height));
        $(document).off('mouseup');
        $(document).off('mousemove');
        if (element.data('type') === 'tile') {
          this.map.tiles[element.data('id')].left = column;
          this.map.tiles[element.data('id')].top = row;
          this.replaceTile(this.map.tiles[element.data('id')], element.data('id'));
        } else if (element.data('type') === 'sprite') {
          this.map.sprites[element.data('id')].left = column;
          this.map.sprites[element.data('id')].top = row;
          this.replaceSprite(this.map.sprites[element.data('id')], element.data('id'));
        } else {
          throw 'Invalid element type';
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

  // public: Downloads current map as a json file.
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

  // public: Uploads json file to the current map.
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