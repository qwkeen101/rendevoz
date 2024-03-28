export { default as useRenderObject } from './useRenderObject'
export * from './menus/ObjectActionMenu'
export { default as useDropObjectArea } from './useDropObjectArea'
export { default as AttachmentObject } from './AttachmentObject'
export { default as AttachmentList } from './AttachmentList'
export { default as AttachmentWrapper } from './AttachmentWrapper'
export { default as useRenderLabel } from './useRenderLabel'
export * from './ObjectTimeline'
export { default as IconNameRenderer } from './IconNameRenderer'
export const intersectionOfMultipleSets = (set1: Set<number>, set2: Set<number>) => {
  const ans = new Set()
  for (let i of set2) {
    if (set1.has(i)) {
      ans.add(i)
    }
  }
  return ans
}
