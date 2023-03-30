export const makeDragElements = (eles: HTMLElement[], e: MouseEvent | PointerEvent) => {
  const containerEl = document.createElement('div')
  containerEl.style.position = 'fixed'
  containerEl.style.inset = '0px'
  eles.forEach(ele => {
    const cloned = ele.cloneNode(true) as HTMLElement
    const rect = ele.getBoundingClientRect()
    cloned.style.position = 'absolute'
    cloned.style.width = `${rect.width}px`
    cloned.style.height = `${rect.height}px`
    cloned.style.left = `${rect.x - e.clientX}px`
    cloned.style.top = `${rect.y - e.clientY}px`
    containerEl.appendChild(cloned)
  })
  return containerEl
}
