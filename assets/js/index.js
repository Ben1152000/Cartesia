import { Io } from './socket.js';
import { Dom } from './dom.js';
import { Grid } from './grid.js';

let io = new Io();
let grid;

export function connectToServer(type) {

  document.getElementById('modal-input-submit').addEventListener('click', attemptConnection);
  document.getElementById('modal-input-launch').click();

  $('#modal-input').on('hidden.bs.modal', function (e) {
    document.getElementById('modal-input-submit').removeEventListener('click', attemptConnection);
    document.getElementById('modal-input-alert').setAttribute('hidden', '');
  })

  function attemptConnection(event) {
    event.preventDefault();
    var value = parseInt(document.getElementById('modal-input-form').value);

    if (type === "host") { 
      io.host(value, {
        success: hostSuccess,
        failure: failure,
        move: receiveMove,
        join: userJoined
      }); 
    }
    else if (type === "guest") { 
      io.join(value, {
        success: joinSuccess,
        failure: failure,
        push: receivePush,
        move: receiveMove,
        close: serverClosed
      }); 
    }
  }

  function failure(message) {
    var alert = document.getElementById('modal-input-alert');
    alert.removeAttribute('hidden');
    alert.innerText = message;
  }

  function hostSuccess(id) {
    grid = new Grid((sprite) => {
      io.move(sprite);
    });
    io.push(grid.map);
    Dom.setViewMode('host', {id: id, editing: grid.editing})
  }

  function joinSuccess(id) {
    grid = new Grid((sprite) => {
      io.move(sprite);
    });
    io.push(grid.map);
    Dom.setViewMode('guest', {id: id});
  }

  function receivePush(map) {
    grid.map = map;
  }

  function receiveMove(sprite) {
    grid.replaceSprite(sprite);
  }

  function userJoined() {
    io.push(grid.map);
  }

  function serverClosed() {
    disconnectFromServer();
    Dom.displayAlertWindow('Server Closed', 'You were disconnected from the server.');
  }
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