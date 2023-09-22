export type DownloadProgress = {
  total: number
  transferred: number
  speed: number
  eta: number
  remaining: number
  percentage: number
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function ({
  defaultSize = 0,
  emitDelay = 10,
  onProgress = () => null,
  onComplete = () => null,
  onError = () => null
}: {
  onProgress?: (p: DownloadProgress) => void
}) {
  return function FetchProgress(response) {
    const { body, headers, status } = response
    const contentLength = headers.get('content-length') || defaultSize
    const progress = new Progress(contentLength, emitDelay)
    const reader = body.getReader()
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                onComplete({})
                controller.close()
                return
              }
              if (value) {
                progress.flow(value, onProgress)
              }
              controller.enqueue(value)
              push()
            })
            .catch(err => {
              onError(err)
            })
        }

        push()
      }
    })
    return new Response(stream, { headers, status })
  }
}

class Progress {
  constructor(length, emitDelay = 1000) {
    this.length = parseInt(length, 10) || 0
    this.transferred = 0
    this.speed = 0
    this.streamSpeed = speedometer(this.speed || 5000)
    this.initial = false
    this.emitDelay = emitDelay
    this.eventStart = 0
    this.percentage = 0
  }

  getRemainingBytes() {
    return parseInt(this.length, 10) - parseInt(this.transferred, 10)
  }

  getEta() {
    return this.length >= this.transferred ? (this.getRemainingBytes() / this.speed) * 1000000000 : 0
  }

  flow(chunk, onProgress) {
    const chunkLength = chunk.length
    this.transferred += chunkLength
    this.speed = this.streamSpeed(chunkLength)
    this.percentage = Math.round((this.transferred / this.length) * 100)
    if (!this.initial) {
      this.eventStart = Date.now()
      this.initial = true
    }
    if (this.length >= this.transferred || Date.now() - this.eventStart > this.emitDelay) {
      this.eventStart = Date.now()

      const progress = {
        total: this.length,
        transferred: this.transferred,
        speed: this.speed,
        eta: this.getEta()
      }
      if (this.length) {
        progress.remaining = this.getRemainingBytes()
        progress.percentage = this.percentage
      }
      onProgress(progress)
    }
  }
}

let tick = 1
const maxTick = 65535
const resolution = 4
const inc = function () {
  tick = (tick + 1) & maxTick
}

let timer = setInterval(inc, (1000 / resolution) | 0)
if (timer.unref) timer.unref()

function speedometer(seconds: number) {
  let size = resolution * (seconds || 5)
  let buffer = [0]
  let pointer = 1
  let last = (tick - 1) & maxTick

  return function (delta: number) {
    let dist = (tick - last) & maxTick
    if (dist > size) dist = size
    last = tick

    while (dist--) {
      if (pointer === size) pointer = 0
      buffer[pointer] = buffer[pointer === 0 ? size - 1 : pointer - 1]
      pointer++
    }

    if (delta) buffer[pointer - 1] += delta

    let top = buffer[pointer - 1]
    let btm = buffer.length < size ? 0 : buffer[pointer === size ? 0 : pointer]

    return buffer.length < resolution ? top : ((top - btm) * resolution) / buffer.length
  }
}
