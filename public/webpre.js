const { ipcRenderer } = require('electron')

const options = {
  disableImageClick: false
}
// for click in same domain iframe
const windowBlurListener = e => {
  if (document.activeElement.tagName === 'IFRAME') {
    document.activeElement.contentWindow.removeEventListener('click', clickListener, true)
    document.activeElement.contentWindow.addEventListener('click', clickListener, true)
  }
}
window.addEventListener('blur', windowBlurListener)
ipcRenderer.on('disableImageClick', () => {
  options.disableImageClick = true
})
ipcRenderer.on('enableImageClick', () => {
  options.disableImageClick = false
})
const clickListener = e => {
  const closestImage = e.target.closest('img')
  if (closestImage && options.disableImageClick) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
  }
  ipcRenderer.sendToHost('event', {
    eventType: 'click',
    imgSrc: closestImage?.src,
    x: e.clientX,
    y: e.clientY
  })
}
const contextmenuListener = e => {
  if (!e.defaultPrevented) {
    ipcRenderer.sendToHost('event', {
      eventType: 'contextmenu',
      x: e.clientX,
      y: e.clientY
    })
  }
}
const dropListener = e => {
  ipcRenderer.sendToHost('event', {
    eventType: 'drop'
  })
}
const dragListener = e => {
  const dataTransfer = e.dataTransfer
  const data = dataTransfer.types.map(i => [i, dataTransfer.getData(i)])
  ipcRenderer.sendToHost('event', {
    eventType: 'dragstart',
    data
  })
}
const pointerListener = e => {
  if (options.disableImageClick) {
    const img = e.target.closest('img')
    if (img) {
      e.stopPropagation()
      e.preventDefault()
      e.stopImmediatePropagation()
    }
  }
}

const keydownListener = e => {
  ipcRenderer.sendToHost('event', {
    eventType: 'keydown',
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    key: e.key,
    code: e.code
  })
}

const addListener = () => {
  window.addEventListener('click', clickListener, true)
  window.addEventListener('contextmenu', contextmenuListener)
  window.addEventListener('drop', dropListener)
  window.addEventListener('dragstart', dragListener)
  window.addEventListener('keydown', keydownListener, true)

  window.addEventListener('pointerenter', pointerListener, true)
  window.addEventListener('pointermove', pointerListener, true)
  window.addEventListener('pointerover', pointerListener, true)
  window.addEventListener('mouseenter', pointerListener, true)
  window.addEventListener('mousemove', pointerListener, true)
  window.addEventListener('mouseover', pointerListener, true)
}
const clearListener = () => {
  window.removeEventListener('click', clickListener, true)
  window.removeEventListener('contextmenu', contextmenuListener)
  window.removeEventListener('drop', dropListener)
  window.removeEventListener('dragstart', dragListener)
  window.removeEventListener('keydown', keydownListener, true)
  window.removeEventListener('pointerenter', pointerListener, true)
  window.removeEventListener('pointermove', pointerListener, true)
  window.removeEventListener('pointerover', pointerListener, true)
  window.removeEventListener('mouseenter', pointerListener, true)
  window.removeEventListener('mousemove', pointerListener, true)
  window.removeEventListener('mouseover', pointerListener, true)
}

setInterval(() => {
  clearListener()
  addListener()
}, 50)
