export const getCursorElement = () => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const element = document.elementFromPoint(x, y)
    if (element instanceof HTMLElement) return element
  }
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}
