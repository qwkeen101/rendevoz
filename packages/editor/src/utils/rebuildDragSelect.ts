import { IEditorInstance } from '~/typings'

const rebuildDragSelect = (instance: IEditorInstance, e: PointerEvent) => {
  const selectedBlocks = instance.values.selectedBlocks
  if (selectedBlocks.size > 0) {
    // all common blocks,we need to rebuild the column & columnlist view
    const blocks = Array.from(selectedBlocks.values())
      .map(i => i.node)
      .filter(i => i) as HTMLElement[]
    const clonedBlocks = blocks.map(i => {
      const cloned = i.cloneNode(true) as HTMLElement
      const rect = i.getBoundingClientRect()
      cloned.style.position = 'absolute'
      cloned.style.width = `${rect.width}px`
      cloned.style.height = `${rect.height}px`
      cloned.style.left = `${rect.x - e.clientX}px`
      cloned.style.top = `${rect.y - e.clientY}px`
      return cloned
    })
    const containerEl = document.createElement('div')
    containerEl.style.position = 'fixed'
    containerEl.style.inset = '0px'
    clonedBlocks.forEach(i => containerEl.appendChild(i))
    return containerEl
  }
}

export default rebuildDragSelect
