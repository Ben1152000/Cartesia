import { Io } from './socket.js';
import { Dom } from './dom.js';
import { Grid } from './grid.js';

let io = new Io();
let grid;

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
  Dom.displayConfirmLeaveWindow(disconnectFromServer);
}

export function downloadButtonClicked() {
  grid.downloadMapFile(() => {
    Dom.displayAlertWindow("Error", "Cannot download map because no map file is loaded.");
  });
}

export function uploadButtonClicked() {
  grid.uploadMapFile(() => {
    io.push(grid.map);
  }, () => {
    Dom.displayAlertWindow('Error', "Invalid json file.");
  });
}