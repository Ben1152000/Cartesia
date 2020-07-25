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
          grid = new Grid((sprite) => {
            io.move(sprite);
          });
          io.push(grid.map);
          Dom.setViewMode('host', {id: id, editing: grid.editing})
        },

        failure: (message) => {
          Dom.displayNumericInputAlert(message);
        },

        move: (sprite) => {
          grid.replaceSprite(sprite);
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
          grid = new Grid((sprite) => {
            io.move(sprite);
          });
          io.push(grid.map);
          Dom.setViewMode('guest', {id: id});
        },

        failure: (message) => {
          Dom.displayNumericInputAlert(message);
        },

        push: (map) => {
          grid.map = map;
        },

        move: (sprite) => {
          grid.replaceSprite(sprite);
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
  editor = new Editor();
  editor.map = grid.map;
  Dom.setViewMode('edit');
}

export function editorNewButtonClicked() {
  Dom.displayConfirmWindow('Are you sure?',
    'Creating a new map will delete the current map.',
    'Confirm', editor.clear
  );
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
  grid = new Grid((sprite) => {
    io.move(sprite);
  });
  grid.map = editor.map;
  Dom.setViewMode('host', {editing: grid.editing});
  io.push(grid.map);
}