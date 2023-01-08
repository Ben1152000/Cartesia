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
      callback(
        parseInt($('#modal-input-form').val()),
        $('#toggle-hostname-frame').is(':checked')? $('#modal-input-hostname').val() : null
      );
    });
    $('#modal-input-launch').click();
  }

  static toggleHostnameFrame() {
    if ($('#toggle-hostname-frame').is(':checked')) {
      $('#hostname-select-menu').removeAttr('hidden');
    } else {
      $('#hostname-select-menu').attr('hidden', '');
    }
  }

  static closeNumericInputWindow() {
    $('#modal-input').modal('hide');
  }

  static displayNumericInputAlert(message) {
    $('#modal-input-alert').removeAttr('hidden').text(message);
  }

  static displayNewMapWindow(title, action, initial, callback) {
    $('#modal-new-submit').off('click');
    $('#modal-new-alert').attr('hidden', '');
    $('#modal-new-title').text(title);
    $('#modal-new-submit').text(action);
    if ('width' in initial) $('#modal-new-width').val(initial.width);
    if ('height' in initial) $('#modal-new-height').val(initial.height);
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
    /*$('#modal-add-sprite-source').val('');*/
    if (type === 'tile') {
      $('#toggle-frame-menu').attr('hidden', '');
      $('#color-select-menu').attr('hidden', '');
      $('#modal-add-sprite-title').text('Add a tile:');
      $('#source-list').empty();
      $.getJSON("assets/images/shortcuts/tiles.json", (data) => {
        this.populateOptionsList(data);
      }).fail(() => {
        throw 'Couldn\'t open assets/images/shortcuts/tiles.json';
      });
    }
    if (type === 'sprite') {
      $('#toggle-frame-menu').removeAttr('hidden');
      Dom.toggleAddSpriteCharacterFrame();
      $('#modal-add-sprite-title').text('Add a sprite:');
      $('#source-list').empty();
      $.getJSON("assets/images/shortcuts/sprites.json", (data) => { 
        this.populateOptionsList(data);
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
        parseInt($('#modal-add-sprite-height').val()),
        $('#toggle-character-frame').is(':checked')? $('#color-select-menu').data('color'): null
      );
    });
    $('#modal-add-sprite-launch').click();
  }

  static populateOptionsList(data) {
    let modalSource = $('#modal-add-sprite-source');
    let modalWidth = $('#modal-add-sprite-width');
    let modalHeight = $('#modal-add-sprite-height');
    let sourceList = $('#source-list');

    function addOption(name, values) {
      let option = $('<option class="dropdown-item" value="'
          + values.source + '">' + name + '</option>');
      option.data('width', values.width);
      option.data('height', values.height);
      option.on('click', () => {
        modalSource.val(option.val());
        modalWidth.val(option.data('width'));
        modalHeight.val(option.data('height'));
      })
      sourceList.append(option);
    }

    if ('' in data) {
      for (let key in data['']) {
        addOption(key, data[''][key]);
      }
      delete data[''];
    }
    for (let group in data) {
      sourceList.append($('<div class="dropdown-divider"></div>'));
      sourceList.append($('<h6 class="dropdown-header">' + group + '</h6>'))
      for (let key in data[group]) {
        addOption(key, data[group][key]);
      }
    }
    sourceList.children().last().addClass('mb-2');
  }

  static displayAddSpriteAlert(message) {
    $('#modal-add-sprite-alert').removeAttr('hidden').text(message);
  }

  static closeAddSpriteWindow() {
    $('#modal-add-sprite').modal('hide');
  }

  static toggleAddSpriteCharacterFrame() {
    if ($('#toggle-character-frame').is(':checked')) {
      $('#color-select-menu').removeAttr('hidden');
    } else {
      $('#color-select-menu').attr('hidden', '');
    }
  }

  static selectSpriteColor(selection) {
    $('#color-select-menu').children().each((index, element) => {
      $(element).empty();
      if ($(element).val() === selection) {
        $('#color-select-menu').data('color', selection);
        $(element).append($('<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-check2" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>'));
      }
    });
  }

  static setPlayerCount(players) {
    $('#player-label-host').text(players);
    $('#player-label-guest').text(players);
  }

  static makeToast(message, delay) {
    var toast = $('<div class="quizno"></div>');
    toast.text(message);
    toast.delay(1000 * delay).fadeOut(500, () => { toast.remove(); });
    $(document.body).append(toast);
  }

  static isFullscreenEnabled() {
    return (!window.screenTop && !window.screenY);
  }

  static setEditingInfoBox(enabled) {
    if (enabled) {
      $('#guest-editing-info').attr('title', 'Editing enabled');
      $('#guest-editing-info-label').text('Enabled');
      $('#guest-editing-enabled').removeAttr('hidden');
      $('#guest-editing-disabled').attr('hidden', '');
    } else {
      $('#guest-editing-info').attr('title', 'Editing disabled');
      $('#guest-editing-info-label').text('Disabled');
      $('#guest-editing-enabled').attr('hidden', '');
      $('#guest-editing-disabled').removeAttr('hidden');
    }
  }

}



