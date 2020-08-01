
const minScale = 0.5;
const maxScale = 4.0;
const zoomCoeff = 0.005;

export function makeGridZoomable(element) {

  let scale = 1.0;

  function updateScale(element, scale) {
    element.css({
      '--grid-scale': scale,
      transform: 'scale(' + 1 / scale + ') translate(' + 50 * (1 - scale) + '%, ' + 50 * (1 - scale) + '%)',
      width: scale * 100 + 'vw',
      height: 'calc(' + scale * 100 + 'vh - ' + scale * 56 + 'px)'
    })
  }

  element.on('wheel', (event) => {
    
    if (event.ctrlKey) {
      event.preventDefault();
      scale *= event.originalEvent.deltaY * zoomCoeff + 1.0;
      scale = Math.min(maxScale, Math.max(minScale, scale));
      updateScale(element, scale);
    }

  });

  $(document).on('keypress', (event) => {
    
    if ($('.modal:visible').length === 0) {
      let code = event.keyCode || event.which;
      if (code === 49) { scale = 0.5; updateScale(element, scale); }
      else if (code === 50) { scale = 1.0; updateScale(element, scale); }
      else if (code === 51) { scale = 2.0; updateScale(element, scale); }
      else if (code === 52) { scale = 4.0; updateScale(element, scale); }
    }
    
  });

}

