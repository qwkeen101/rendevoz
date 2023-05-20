export const waitFor = (
  condition: () => boolean,
  func: () => void,
  options = {
    timeout: 5000
  }
) => {
  const { timeout } = options
  const start = Date.now()
  const loop = () => {
    const curr = Date.now()
    if (curr - start > timeout) {
      return
    }
    if (condition()) {
      func()
      return
    } else {
      console.log('waiting')
      requestIdleCallback(loop)
    }
  }

  loop()
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
