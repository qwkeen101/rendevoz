import { intervalToDuration } from 'date-fns'

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

export const captureVideoFrame = (video: HTMLVideoElement, time: number): Promise<string> => {
  return new Promise(res => {
    video.currentTime = time
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.height = 300
      canvas.width = 533
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL()
      res(dataUrl)
    }
  })
}

const zeroPad = (num: number) => String(num).padStart(2, '0')

export const normalizeSecondsToTime = (seconds: number) => {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
  return `${duration.hours ? duration.hours + ':' : ''}${duration.hours ? zeroPad(duration.minutes || 0) : duration.minutes}:${zeroPad(
    duration.seconds || 0
  )}`
}
