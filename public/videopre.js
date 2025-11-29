const { ipcRenderer } = require('electron')

let interval
let videoLoaded = false
let videoElement = null
let wrapperElement = null

ipcRenderer.on('videoEvent', (e, payload) => {
  const v = videoElement || window.document.body.querySelector('video')
  switch (payload.type) {
    case 'stop': {
      v && v.pause()
      break
    }
    case 'mute': {
      v && (v.muted = payload.muted)
      break
    }
    case 'speed': {
      v && (v.playbackRate = payload.speed)
      break
    }
    case 'volume': {
      v && (v.volume = payload.volume)
      break
    }
    case 'play': {
      v && v.play()
      break
    }
    case 'jump': {
      if (v) {
        v.currentTime = Number(payload.time)
      }
      break
    }
    case 'captureSnapshot': {
      if (v) {
        try {
          const res = captureVideoFrame(v)
          ipcRenderer.sendToHost('event', {
            type: 'captureImage',
            url: res
          })
        } catch (e) {
          ipcRenderer.sendToHost('event', {
            type: 'captureImage',
            url: ''
          })
        }
      } else {
        ipcRenderer.sendToHost('event', {
          type: 'captureImage',
          url: ''
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
  const canvas = window.document.createElement('canvas')
  const realHeight = (video.videoHeight / video.videoWidth) * size.width
  canvas.height = realHeight
  canvas.width = size.width
  const ctx = canvas.getContext('2d')
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL()
  return dataUrl
}

window.addEventListener('DOMContentLoaded', () => {
  setInterval(() => {
    const classes = ['ytp-gradient-top', 'ytp-chrome-top', 'ytp-watermark', 'ytp-pause-overlay-container', 'videowall-endscreen']
    window.document.body.querySelectorAll(classes.map(i => `.${i}`).join(',')).forEach(i => i.remove())
  }, 100)
})
window.addEventListener('DOMContentLoaded', () => {
  interval = setInterval(() => {
    if (videoLoaded) {
      clearInterval(interval)
      return
    }
    const currentUrl = window.location.href
    if (!currentUrl.includes('bilibili') && !currentUrl.includes('youtube')) {
      videoElement = Array.from(window.document.body.querySelectorAll('video') || []).find(i => i.hasAttribute('src'))
      if (videoElement) {
        videoLoaded = true
      }
    }
    if (currentUrl.includes('bilibili')) {
      const bilibiliVideoWrapper = window.document.body.querySelector('#bilibiliPlayer')
      const fullScreenButton = window.document.body.querySelector('.bilibili-player-video-web-fullscreen')
      if (bilibiliVideoWrapper && fullScreenButton) {
        videoElement = bilibiliVideoWrapper.querySelector('video')
        wrapperElement = bilibiliVideoWrapper
        if (videoElement) {
          videoLoaded = true
          wrapperElement.querySelector('.bilibili-player-video-web-fullscreen')?.click()
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
const prepareVideo = () => {
  if (videoElement) {
    if (videoElement.src.startsWith('http://') || videoElement.src.startsWith('https://')) {
      window.location.href = videoElement.src
    }
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
