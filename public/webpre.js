const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener(
    'click',
    () => {
      ipcRenderer.sendToHost('event', {
        eventType: 'click'
      })
    },
    true
  )
  document.addEventListener('contextmenu', e => {
    ipcRenderer.sendToHost('event', {
      eventType: 'contextmenu',
      x: e.clientX,
      y: e.clientY
    })
  })
  document.addEventListener('drop', e => {
    ipcRenderer.sendToHost('event', {
      eventType: 'drop'
    })
  })
  document.addEventListener('dragstart', e => {
    const dataTransfer = e.dataTransfer
    const data = dataTransfer.types.map(i => [i, dataTransfer.getData(i)])
    ipcRenderer.sendToHost('event', {
      eventType: 'dragstart',
      data
    })
  })
})
