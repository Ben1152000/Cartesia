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
      $('#grid').removeAttr('hidden');
      $('#grid').removeClass('editor');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').removeAttr('hidden');
      $('#guest-toolbar').attr('hidden', '');
      $('#editor-toolbar').attr('hidden', '');
      if (typeof params.id !== 'undefined') {
        $('#server-label-host').text(params.id);
      }
      Dom.setEditingButtonMode(params.editing);

    } else if (type === 'guest') {
      $('#grid').removeAttr('hidden');
      $('#grid').removeClass('editor');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').removeAttr('hidden');
      $('#editor-toolbar').attr('hidden', '');
      $('#server-label-guest').text(params.id);

    } else if (type === 'edit') {
      $('#grid').removeAttr('hidden');
      $('#grid').addClass('editor');
      $('#welcome').attr('hidden', '');
      $('#host-toolbar').attr('hidden', '');
      $('#guest-toolbar').attr('hidden', '');
      $('#editor-toolbar').removeAttr('hidden');
      
    } else {
      throw 'Invalid view mode:' + type;
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
    $('#modal-confirm-submit').off('click');
    $('#modal-confirm-title').text(title);
    $('#modal-confirm-message').text(message);
    $('#modal-confirm-submit').text(action);
    $('#modal-confirm-submit').on('click', callback);
    $('#launch-modal-confirm').click();
  }

  static requestNumericInputWindow(callback) {
    $('#modal-input-submit').off('click');
    $('#modal-input-alert').attr('hidden', '');
    $('#modal-input-submit').on('click', (event) => {
      console.log('form submitted');
      event.preventDefault();
      callback(parseInt($('#modal-input-form').val()));
    });
    $('#modal-input-launch').click();
  }

  static closeNumericInputWindow() {
    $('#modal-input').modal('hide');
  }

  static displayNumericInputAlert(message) {
    $('#modal-input-alert').removeAttr('hidden').text(message);
  }

  static displayNewMapWindow(callback) {
    $('#modal-new-submit').off('click');
    $('#modal-new-alert').attr('hidden', '');
    $('#modal-new-submit').on('click', (event) => {
      console.log('form submitted');
      event.preventDefault();
      callback(
        parseInt($('#modal-new-width').val()), 
        parseInt($('#modal-new-height').val())
      );
    });
    $('#modal-new-launch').click();
  }

  static displayNewMapAlert(message) {
    $('#modal-new-alert').removeAttr('hidden').text(message);
  }

  static closeNewMapWindow() {
    $('#modal-new').modal('hide');
  }

  static displayAddSpriteWindow(type, callback) {
    $('#modal-add-sprite-submit').off('click');
    $('#modal-add-sprite-alert').attr('hidden', '');
    $('#modal-add-sprite-source').val('');
    if (type === 'tile') {
      $('#modal-add-sprite-title').text('Add a tile:');
      $('#source-list').empty();
      $.getJSON("assets/images/shortcuts/tiles.json", (data) => {
        for (name in data) {
          let option = $('<option value="' + data[name].source + '">' + name + '</option>');
          option.data('width', data[name].width);
          option.data('height', data[name].height);
          $('#source-list').append(option);
        }
      }).fail(() => {
        throw 'Couldn\'t open assets/images/shortcuts/tiles.json';
      });
    }
    if (type === 'sprite') {
      $('#modal-add-sprite-title').text('Add a sprite:');
      $('#source-list').empty();
      $.getJSON("assets/images/shortcuts/sprites.json", (data) => {
        for (name in data) {
          let option = $('<option value="' + data[name].source + '">' + name + '</option>');
          option.data('width', data[name].width);
          option.data('height', data[name].height);
          $('#source-list').append(option);
        }
      }).fail(() => {
        throw 'Couldn\'t open assets/images/shortcuts/sprites.json';
      });
    }
    $('#modal-add-sprite-submit').on('click', (event) => {
      console.log('form submitted');
      event.preventDefault();
      callback(
        $('#modal-add-sprite-source').val().replace(' ', '%20'), 
        parseInt($('#modal-add-sprite-width').val()), 
        parseInt($('#modal-add-sprite-height').val())
      );
    });
    $('#modal-add-sprite-launch').click();
  }

  static populateOptionSettings() {
    let input = $('#modal-add-sprite-source');
    $('#source-list > option').each((index, option) => {
      if ($(option).val() === input.val()) {
        $('#modal-add-sprite-width').val($(option).data('width'));
        $('#modal-add-sprite-height').val($(option).data('height'));
      }
    });
  }

  static displayAddSpriteAlert(message) {
    $('#modal-add-sprite-alert').removeAttr('hidden').text(message);
  }

  static closeAddSpriteWindow() {
    $('#modal-add-sprite').modal('hide');
  }

  static makeToast(message, delay) {
    var toast = $('<div class="quizno"></div>');
    toast.text(message);
    toast.delay(1000 * delay).fadeOut(500, () => { toast.remove(); });
    $(document.body).append(toast);
  }

}



