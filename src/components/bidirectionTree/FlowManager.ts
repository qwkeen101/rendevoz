import { Position } from '@/types'

class FlowManager {
  public ID_TO_NODE_ELEMENT_MAP = new Map<
    number,
    {
      element?: HTMLElement | null
    }
  >()
  public ID_TO_EDGE_MAP = new Map<
    number,
    {
      element?: SVGPathElement | null
      drawPath: VoidFunction
    }
  >()
  public containerEle?: HTMLElement
  public containerTransformScale = 1
  public updateNodePosition = (nodeId: number, newPos: Position) => {}
}

export default FlowManager
