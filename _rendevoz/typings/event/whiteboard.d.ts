import { Event, IWhiteboardNode } from '..'
import { Operation } from 'slate'
import { Rnd } from 'react-rnd'

type NodeDragEvent = {
  draggingNode: IWhiteboardNode & { mouseX: number; mouseY: number; deltaHeight: number; deltaWidth: number; mouseWidth: number; mouseHeight: number }
  nodeElement: HTMLElement
}

type NodeResizeEvent = {
  resizingNode: IWhiteboardNode
  nodeElement: HTMLElement
  rnd: Rnd
}
export interface WhiteboardEventMap {
  nodeDrag: NodeDragEvent
  nodeDragStart: {
    draggingNode: IWhiteboardNode
  }
  nodeDragEnd: VoidFunction
  nodeResize: NodeResizeEvent
  nodeResizeEnd: VoidFunction
  nodeResizeStart: {
    resizingNode: IWhiteboardNode
  }
}

export type WhiteboardEvent = Event<WhiteboardEventMap, keyof WhiteboardEventMap>
