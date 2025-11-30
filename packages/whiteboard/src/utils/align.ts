import { Box } from '../types/geometry'

export type IdToBoxMap = Map<number, Box>

export const alignNodes = (
  alignment: 'left' | 'right' | 'verticalCenter' | 'horizontalCenter' | 'top' | 'bottom',
  map: IdToBoxMap
): IdToBoxMap => {
  const cloned = structuredClone(map) as IdToBoxMap
  switch (alignment) {
    case 'left':
      return alignLeftNodes(cloned)
    case 'right':
      return alignRightNodes(cloned)
    case 'horizontalCenter':
      return horizontalAlignCenterNodes(cloned)
    case 'verticalCenter':
      return verticalAlignCenterNodes(cloned)
    case 'top':
      return alignTopNodes(cloned)
    case 'bottom':
      return alignBottomNodes(cloned)
  }
}

export const alignLeftNodes = (map: IdToBoxMap) => {
  const minX = Math.min(...Array.from(map.values()).map(b => b.left ?? b.x))
  map.forEach(box => {
    box.left = minX
    box.x = minX
  })
  return map
}

export const alignRightNodes = (map: IdToBoxMap) => {
  const maxX = Math.max(...Array.from(map.values()).map(b => (b.left ?? b.x) + b.width))
  map.forEach(box => {
    const left = maxX - box.width
    box.left = left
    box.x = left
  })
  return map
}

export const alignBottomNodes = (map: IdToBoxMap) => {
  const maxY = Math.max(...Array.from(map.values()).map(b => (b.top ?? b.y) + b.height))
  map.forEach(box => {
    const top = maxY - box.height
    box.top = top
    box.y = top
  })
  return map
}

export const alignTopNodes = (map: IdToBoxMap) => {
  const minY = Math.min(...Array.from(map.values()).map(b => b.top ?? b.y))
  map.forEach(box => {
    box.top = minY
    box.y = minY
  })
  return map
}

export const horizontalAlignCenterNodes = (map: IdToBoxMap) => map
export const verticalAlignCenterNodes = (map: IdToBoxMap) => map
