const { ipcRenderer } = require('electron')

const options = {
  disableImageClick: true
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

const clickListener = e => {
  const closestImage = e.target.closest('img')
  if (closestImage) {
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

  ipcRenderer.sendToHost('event', {
    eventType: 'contextmenu',
    x: e.clientX,
    y: e.clientY
  })
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
  const img = e.target.closest('img')
  if (img) {
    e.stopPropagation()
    e.preventDefault()
    e.stopImmediatePropagation()
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
  window.addEventListener('contextmenu', contextmenuListener, true)
  window.addEventListener('drop', dropListener)
  window.addEventListener('dragstart', dragListener)
  window.addEventListener('keydown', keydownListener, true)
  if (options.disableImageClick) {
    window.addEventListener('pointerenter', pointerListener, true)
    window.addEventListener('pointermove', pointerListener, true)
    window.addEventListener('pointerover', pointerListener, true)
    window.addEventListener('mouseenter', pointerListener, true)
    window.addEventListener('mousemove', pointerListener, true)
    window.addEventListener('mouseover', pointerListener, true)
  }
}
const clearListener = () => {
  window.removeEventListener('click', clickListener, true)
  window.removeEventListener('contextmenu', contextmenuListener, true)
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
