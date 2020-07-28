import { Io } from '/assets/js/socket.js';
import { Dom } from '/assets/js/dom.js';
import { Grid } from '/assets/js/grid.js';
import { Editor } from '/assets/js/editor.js';

let io = new Io();
let grid;
let editor;

export function connectToServer(type) {

  Dom.requestNumericInputWindow((id) => {
    if (type === "host") { 
      io.host(id, {

        success: (id) => {
          grid = new Grid((packet) => {
            io.move(packet);
          });
          io.push(grid.map);
          Dom.closeNumericInputWindow();
          Dom.setViewMode('host', {id: id, editing: grid.editing})
        },

        failure: (message) => {
          Dom.displayNumericInputAlert(message);
        },

        move: (packet) => {
          grid.replaceSprite(packet.sprite, packet.id);
        },

        join: () => {
          io.push(grid.map);
          Dom.makeToast("Player joined", 1.5);
        },

        settings: (changed) => {
          if ('editing' in changed) {
            if (changed.editing) {
              Dom.makeToast('Editing enabled', 1.5);
            } else {
              Dom.makeToast('Editing disabled', 1.5);
            }
          }
        }

      }); 
    }
    else if (type === "guest") { 
      io.join(id, {

        success: (id) => {
          grid = new Grid((packet) => {
            io.move(packet);
          });
          io.push(grid.map);
          Dom.closeNumericInputWindow();
          Dom.setViewMode('guest', {id: id});
        },

        failure: (message) => {
          Dom.displayNumericInputAlert(message);
        },

        push: (map) => {
          grid.map = map;
        },

        move: (packet) => {
          grid.replaceSprite(packet.sprite, packet.id);
        },

        close: () => {
          disconnectFromServer();
          Dom.displayAlertWindow('Server Closed', 'You were disconnected from the server.');
        },

        settings: (changed) => {
          if ('editing' in changed) {
            if (changed.editing) {
              Dom.makeToast('Editing enabled', 1.5);
            } else {
              Dom.makeToast('Editing disabled', 1.5);
            }
          }
        }

      }); 
    }
  });
}

export function disconnectFromServer() {
  io.disconnect();
  Dom.setViewMode('welcome', {});
}

export function editingButtonClicked() {
  grid.toggleEditing(() => {
    io.changeSettings(grid.settings);
  });
  Dom.setEditingButtonMode(grid.settings.editing);
}

export function leaveButtonClicked() {
  Dom.displayConfirmWindow(
    'Confirm Leave', 
    'Are you sure you want to leave? If you are hosting, the server will be closed.', 
    'Leave', disconnectFromServer
  );
}

export function downloadButtonClicked() {
  grid.downloadMapFile(() => {
    Dom.displayAlertWindow("Error", "Cannot download map because no map file is loaded.");
  });
}

export function uploadButtonClicked() {
  grid.uploadMapFile(() => {
    io.push(grid.map);
    Dom.makeToast('Upload successful', 1.5);
  }, () => {
    Dom.displayAlertWindow('Error', "Invalid json file.");
  });
}

export function editButtonClicked() {
  grid.clear();
  if (grid.settings.editing) {
    editingButtonClicked();
  }
  editor = new Editor();
  editor.map = grid.map;
  Dom.setViewMode('edit');
}

export function editorNewButtonClicked() {
  Dom.displayNewMapWindow((width, height) => { 
    if (typeof width !== 'number' || !Number.isInteger(width) || width < 1) {
      Dom.displayNewMapAlert('Width must be a positive integer.')
    } else if (typeof height !== 'number' || !Number.isInteger(height) || height < 1) {
      Dom.displayNewMapAlert('Height must be a positive integer.')
    } else {
      Dom.closeNewMapWindow();
      if (editor.map.name === null) {
        editor.reset((width * height)? "map-" + Date.now(): null, width, height);
      } else {
        Dom.displayConfirmWindow('Are you sure?',
          'Creating a new map will delete the current map.',
          'Confirm', () => { 
            editor.reset((width * height)? "map-" + Date.now(): null, width, height);
          }
        );
      }
    }
  });
}

export function editorAddTileButtonClicked() {
  if (editor.map.name === null) {
    Dom.displayAlertWindow('Error', 'You must create or upload a map before adding a tile.');
  } else {
    Dom.displayAddSpriteWindow('tile', (source, width, height) => {
      if (typeof width !== 'number' || !Number.isInteger(width) || width < 1) {
        Dom.displayAddSpriteAlert('Width must be a positive integer.');
      } else if (typeof height !== 'number' || !Number.isInteger(height) || height < 1) {
        Dom.displayAddSpriteAlert('Height must be a positive integer.');
      } else if (source === '') {
        Dom.displayAddSpriteAlert('Source field cannot be empty');
      } else {
        $.ajax({
          url: source.startsWith("http:")? source: (source.startsWith("https:")? source: ("assets/images/tiles/" + source)),
          type: 'HEAD',
          error: () => { 
            Dom.displayAddSpriteAlert('Image does not exist'); 
          },
          success: () => { 
            editor.replaceTile({
              source: source,
              top: 0,
              left: 0, 
              width: width,
              height: height,
              flip: false,
              rotate: 0
            }, 'tile-' + Date.now());
            Dom.closeAddSpriteWindow();
          }
        });
      }
    });
  }
}

export function editorAddSpriteButtonClicked() {
  if (editor.map.name === null) {
    Dom.displayAlertWindow('Error', 'You must create or import a map before adding a sprite.');
  } else {
    Dom.displayAddSpriteWindow('sprite', (source, width, height, color) => {
      if (typeof width !== 'number' || !Number.isInteger(width) || width < 1) {
        Dom.displayAddSpriteAlert('Width must be a positive integer.');
      } else if (typeof height !== 'number' || !Number.isInteger(height) || height < 1) {
        Dom.displayAddSpriteAlert('Height must be a positive integer.');
      } else if (source === '') {
        Dom.displayAddSpriteAlert('Source field cannot be empty');
      } else {
        $.ajax({
          url: source.startsWith("http:")? source: (source.startsWith("https:")? source: ("assets/images/sprites/" + source)),
          type: 'HEAD',
          error: () => { 
            Dom.displayAddSpriteAlert('Image does not exist'); 
          },
          success: () => { 
            let sprite = {
              source: source,
              top: 0,
              left: 0, 
              width: width,
              height: height,
              flip: false,
              rotate: 0
            }
            if (color !== null) sprite.color = color;
            editor.replaceSprite(sprite, 'sprite-' + Date.now());
            Dom.closeAddSpriteWindow();
          }
        });
      }
    });
  }
}

export function editorDownloadButtonClicked() {
  editor.download(() => {
    Dom.displayAlertWindow("Error", "Cannot download map because no map file is loaded.");
  });
}

export function editorUploadButtonClicked() {
  editor.upload(() => {
    Dom.makeToast('Upload successful', 1.5);
  }, () => {
    Dom.displayAlertWindow('Error', "Invalid json file.");
  });
}

export function saveExitButtonClicked() {
  editor.clear();
  grid = new Grid((packet) => {
    io.move(packet);
  });
  grid.map = editor.map;
  Dom.setViewMode('host', {editing: grid.editing});
  io.push(grid.map);
}

export function feelingLucky() {
  if ($('#grid').is(':visible') && $('#editor-toolbar').is(':hidden'))
    grid.replaceSprite({
      source: 'https://bdarnell.com/assets/images/profile-core.webp',
      top: 0, left: 0, width: 1, height: 1, flip: false, rotate: 0}, 
      'sprite-lucky-' + Date.now()
    );
}