export const waitFor = (
  condition: () => boolean,
  func: () => void,
  options: {
    timeout?: number
    checkDelay?: number
    checkTime?: number
    onTimeout?: (timeUsed: number) => void
    // check mutiple times and every time should be true, if false, retry
    checkEnsure?: number
    requestAnimationFrame?: boolean
    microTask?: boolean
  } = {
    timeout: 5000,
    checkDelay: 0,
    checkEnsure: 1
  }
) => {
  const { timeout = 5000, checkDelay = 0, checkEnsure = 1, onTimeout } = options
  let ensured = 0
  const start = Date.now()
  const loop = () => {
    const curr = Date.now()
    if (curr - start > timeout) {
      onTimeout?.(curr - start)
      return
    }
    if (condition()) {
      ensured += 1
      if (ensured >= checkEnsure) {
        func()
        return
      }
    } else {
      ensured = 0
    }
    console.log('waiting')
    if (checkDelay) {
      setTimeout(() => {
        if (options.requestAnimationFrame) {
          requestAnimationFrame(loop)
        } else {
          requestIdleCallback(loop)
        }
      }, checkDelay)
    } else {
      if (options.microTask) {
        queueMicrotask(loop)
      } else if (options.requestAnimationFrame) {
        requestAnimationFrame(loop)
      } else {
        requestIdleCallback(loop)
      }
    }
  }

  loop()
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const loopProcess = <T>(
  items: T[],
  processor: (item: T, index: number) => Promise<void>,
  cbs?: {
    onEndProcess?: (item: T, index: number) => void
    onBeginProcess?: (item: T, index: number) => void
    onEnd?: () => void
  }
) => {
  const index = {
    current: 0
  }
  const asyncLoopItems = async () => {
    const idx = index.current
    if (idx === items.length) {
      cbs?.onEnd?.()
      return
    } else {
      index.current += 1
    }
    const currItem = items[idx]
    cbs?.onBeginProcess?.(currItem, idx)
    await processor(items[idx], idx)
    cbs?.onEndProcess?.(currItem, idx)
    asyncLoopItems()
  }

  asyncLoopItems()
}
