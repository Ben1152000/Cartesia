export class Dom {

  static setViewMode(type, params) {

    if (type === 'welcome') {
      $('#grid').attr('hidden', '');
      $('#welcome').removeAttr('hidden');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').attr('hidden', '');

    } else if (type === 'host') {
      $('#modal-input').modal('hide');
      $('#grid').removeAttr('hidden');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').removeAttr('hidden');
      $('#guest-toolbar').attr('hidden', '');
      $('#server-label-host').text(params.id);
      Dom.setEditingButtonMode(params.editing);

    } else if (type === 'guest') {
      $('#modal-input').modal('hide');
      $('#grid').removeAttr('hidden');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').removeAttr('hidden');
      $('#server-label-guest').text(params.id);

    } else if (type === 'edit') {

      /* TODO: create edit mode */
      
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

  static displayConfirmLeaveWindow(callback) {
    $('#modal-confirm-submit').on('click', callback);
    $('#modal-confirm').on('hidden.bs.modal', function (event) {
      $('#modal-confirm-submit').off('click', callback);
    })
    $('#launch-modal-confirm').click();
  }

}