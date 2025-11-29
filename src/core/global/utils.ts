import { XYPosition } from '~/typings'

export const getPanelPosition = (options: {
  pos?: XYPosition
  e?: PointerEvent | MouseEvent
  defaultSize: { width: number; height: number }
}) => {
  let pos: XYPosition | null = null
  // disable change position when panel is visible
  if (options.e || options.pos) {
    if (options.pos) pos = options.pos
    if (options.e && !pos) {
      pos = {
        x: options.e.clientX - options.defaultSize.width / 2,
        y: options.e.clientY - 10
      }
    }
  }
  if (pos) {
    pos.x = Math.max(Math.min(pos.x, window.innerWidth - 20 - options.defaultSize.width), 20)
    pos.y = Math.max(Math.min(pos.y, window.innerHeight - 20 - options.defaultSize.height), 20)
  }
  return pos
}
