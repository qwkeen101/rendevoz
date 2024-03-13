import { randomIntFromInterval } from '@/utils/math'
import { intervalToDuration } from 'date-fns'
import { Size } from '~/typings'

export const getVideoSnap = (videoUrl: string, time: number): Promise<string> => {
  return new Promise(res => {
    const video = document.createElement('video')
    video.src = videoUrl
    video.onloadedmetadata = () => {
      video.currentTime = time
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.height = 1000
      canvas.width = 2130
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL()
      res(dataUrl)
    }
  })
}

export const captureVideoFrame = (
  video: HTMLVideoElement,
  time: number,
  size: Size = {
    width: 533,
    height: 300
  },
  skipSeek?: boolean
): Promise<string> => {
  return new Promise(res => {
    const realHeight = size.width === 533 ? size.height : (video.videoHeight / video.videoWidth) * size.width
    if (!skipSeek) {
      video.currentTime = time
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.height = Number(realHeight)
        canvas.width = Number(size.width)
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL()
        res(dataUrl)
      }
    } else {
      const canvas = document.createElement('canvas')
      canvas.height = Number(realHeight)
      canvas.width = Number(size.width)
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL()
      res(dataUrl)
    }
  })
}

export const captureVideoFrameBlob = (video: HTMLVideoElement, time: number): Promise<Blob> => {
  return new Promise(res => {
    video.currentTime = time
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.height = 300
      canvas.width = 533
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => {
        if (b) {
          res(b)
        }
      })
    }
  })
}
const zeroPad = (num: number) => String(num).padStart(2, '0')

export const normalizeSecondsToTime = (seconds: number) => {
  try {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
    return `${duration.hours ? duration.hours + ':' : ''}${
      duration.hours ? zeroPad(duration.minutes || 0) : duration.minutes || 0
    }:${zeroPad(duration.seconds || 0)}`
  } catch (e) {
    return '00:00'
  }
}

export const generateVideoThumbnail = (file: File, time?: number): Promise<string> => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const video = document.createElement('video')

    // this is important
    const url = URL.createObjectURL(file)
    video.muted = true
    video.src = url

    video.onloadeddata = () => {
      video.currentTime = time || randomIntFromInterval(0, video.duration)
    }
    video.onseeked = () => {
      const ctx = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
      video.pause()
      URL.revokeObjectURL(url)
      return resolve(canvas.toDataURL('image/png'))
    }
  })
}
