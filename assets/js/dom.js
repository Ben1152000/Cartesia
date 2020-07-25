// This class acts as an interface with the webpage Document Object Model
export class Dom {

  static setViewMode(type, params) {

    if (type === 'welcome') {
      $('#grid').attr('hidden', '');
      $('#welcome').removeAttr('hidden');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').attr('hidden', '');
      $('#editor-toolbar').attr('hidden', '');

    } else if (type === 'host') {
      $('#modal-input').modal('hide');
      $('#grid').removeAttr('hidden');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').removeAttr('hidden');
      $('#guest-toolbar').attr('hidden', '');
      $('#editor-toolbar').attr('hidden', '');
      if (typeof params.id !== 'undefined') {
        $('#server-label-host').text(params.id);
      }
      Dom.setEditingButtonMode(params.editing);

    } else if (type === 'guest') {
      $('#modal-input').modal('hide');
      $('#grid').removeAttr('hidden');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').removeAttr('hidden');
      $('#editor-toolbar').attr('hidden', '');
      $('#server-label-guest').text(params.id);

    } else if (type === 'edit') {
      $('#grid').removeAttr('hidden');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').attr('hidden', '');
      $('#editor-toolbar').removeAttr('hidden');
      
    } else {
      console.log("ERROR: Invalid view mode:", type);
    }
  }

  static setEditingButtonMode(editing) {
    if (editing) {
      $('#button-editing').attr('title', 'Editing enabled');
      $('#button-editing-enabled').removeAttr('hidden');
      $('#button-editing-disabled').attr('hidden', '');
    } else {
      $('#button-editing').attr('title', 'Editing disabled');
      $('#button-editing-enabled').attr('hidden', '');
      $('#button-editing-disabled').removeAttr('hidden');
    }
  }

  static displayAlertWindow(title, message) {
    $('#modal-alert-title').text(title);
    $('#modal-alert-message').text(message);
    $('#launch-modal-alert').click();
  }

  static displayConfirmWindow(title, message, action, callback) {
    $('#modal-confirm-title').text(title);
    $('#modal-confirm-message').text(message);
    $('#modal-confirm-submit').text(action);
    $('#modal-confirm-submit').on('click', callback);
    $('#modal-confirm').on('hidden.bs.modal', function (event) {
      $('#modal-confirm-submit').off('click', callback);
    })
    $('#launch-modal-confirm').click();
  }

  static requestNumericInputWindow(callback) {
    document.getElementById('modal-input-submit').addEventListener('click', onSubmit);
    document.getElementById('modal-input-launch').click();
    $('#modal-input').on('hidden.bs.modal', function (event) {
      document.getElementById('modal-input-submit').removeEventListener('click', onSubmit);
      document.getElementById('modal-input-alert').setAttribute('hidden', '');
    })
    function onSubmit(event) {
      event.preventDefault();
      callback(parseInt(document.getElementById('modal-input-form').value));
    }
  }

  static displayNumericInputAlert(message) {
    var alert = document.getElementById('modal-input-alert');
    alert.removeAttribute('hidden');
    alert.innerText = message;
  }

  static makeToast(message, delay) {
    var toast = $('<div class="quizno"></div>');
    toast.text(message);
    toast.delay(1000 * delay).fadeOut(500, () => { toast.remove(); });
    $(document.body).append(toast);
  }

}



