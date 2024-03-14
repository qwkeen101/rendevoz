const { ipcRenderer } = require('electron')

let interval
let videoLoaded = false
let videoElement = null
let wrapperElement = null

ipcRenderer.on('videoEvent', (e, payload) => {
  if (!videoElement) return
  const v = videoElement
  switch (payload.type) {
    case 'stop': {
      v.pause()
      break
    }
    case 'play': {
      v.play()
      break
    }
    case 'jump': {
      v.currentTime = Number(payload.time)
      break
    }
    case 'captureSnapshot': {
      if (videoElement) {
        captureVideoFrame(videoElement).then(res => {
          ipcRenderer.sendToHost('event', {
            type: 'captureImage',
            url: res
          })
        })
      }
      break
    }
  }
})
const captureVideoFrame = (
  video,
  size = {
    width: 1280,
    height: 720
  }
) => {
  return new Promise(res => {
    const canvas = window.document.createElement('canvas')
    const realHeight = (video.videoHeight / video.videoWidth) * Number(size.width)
    canvas.height = realHeight
    canvas.width = Number(size.width)
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL()
    res(dataUrl)
  })
}

const showAll = () => {
  window.document.body.style.display = 'block'
}
let replaced = false
window.addEventListener('DOMContentLoaded', () => {
  interval = setInterval(() => {
    if (videoLoaded) {
      clearInterval(interval)
      return
    }
    const currentUrl = window.location.href
    if (!currentUrl.includes('bilibili') && !currentUrl.includes('youtube')) {
      videoElement = window.document.body.querySelector('video')
      if (videoElement) {
        wrapperElement = videoElement.parentElement
        videoLoaded = true
      }
      return
    }
    if (currentUrl.includes('bilibili')) {
      const bilibiliVideoWrapper = window.document.body.querySelector('#bilibiliPlayer')
      const fullScreenButton = window.document.body.querySelector('.bilibili-player-video-web-fullscreen')
      if (bilibiliVideoWrapper && fullScreenButton) {
        videoElement = bilibiliVideoWrapper.querySelector('video')
        wrapperElement = bilibiliVideoWrapper
        if (videoElement) {
          wrapperElement.querySelector('.bilibili-player-video-web-fullscreen')?.click()
          videoLoaded = true
        }
      }
    }
    if (currentUrl.includes('youtube')) {
      const youtubeVideoWrapper = window.document.body.querySelector('#player')
      if (youtubeVideoWrapper) {
        videoElement = youtubeVideoWrapper.querySelector('video')
        wrapperElement = youtubeVideoWrapper
        if (videoElement) {
          videoLoaded = true
        }
      }
    }

    if (videoLoaded) {
      if (replaced) return
      replaced = true
      showAll()
      window.document.body.replaceChildren(wrapperElement)
      clearInterval(interval)
      prepareVideo()
      ipcRenderer.sendToHost('event', {
        type: 'loaded'
      })
    } else {
      ipcRenderer.sendToHost('videoNotLoaded')
    }
  }, 100)
})

setInterval(() => {
  if (wrapperElement) {
    const pbp = wrapperElement.querySelector('.bpx-player-pbp')
    if (pbp) {
      pbp.style.display = 'none'
    }
  }
}, 1000)
const prepareVideo = () => {
  if (videoElement) {
    wrapperElement.style.position = 'absolute'
    wrapperElement.style.left = '0px'
    wrapperElement.style.top = '0px'
    wrapperElement.style.width = '100%'
    wrapperElement.style.height = '100%'
    wrapperElement.parentElement.style.overflow = 'hidden'
    const d = videoElement.duration
    if (d) {
      ipcRenderer.sendToHost('event', {
        type: 'durationChange',
        duration: d
      })
    }
    videoElement.addEventListener('pause', () => {
      ipcRenderer.sendToHost('event', {
        type: 'pause'
      })
    })
    if (videoElement.autoplay) {
      ipcRenderer.sendToHost('event', {
        type: 'play'
      })
    }
    videoElement.addEventListener('play', () => {
      ipcRenderer.sendToHost('event', {
        type: 'play'
      })
    })
    videoElement.addEventListener('timeupdate', e => {
      const time = e.currentTarget.currentTime
      ipcRenderer.sendToHost('event', {
        type: 'timeUpdate',
        time
      })
    })
    videoElement.addEventListener('durationchange', e => {
      const duration = e.currentTarget.duration
      if (duration) {
        ipcRenderer.sendToHost('event', {
          type: 'durationChange',
          duration
        })
      }
    })
  }
}
