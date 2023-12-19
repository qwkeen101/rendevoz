import { Box, Event, IWhiteboardNode } from '..'
import { Operation } from 'slate'
import { Rnd } from 'react-rnd'
import { ResizeDirection } from 're-resizable'

type NodeDragEvent = {
  draggingNode: IWhiteboardNode & { mouseX: number; mouseY: number; deltaHeight: number; deltaWidth: number; mouseWidth: number; mouseHeight: number }
  nodeElement: HTMLElement
}

type NodeResizeEvent = {
  // before resize box
  originalBox: Box
  // realtime box
  realtimeBox: Box
  // pointer move box
  pointerBox: Box
  resizingNode: IWhiteboardNode
  nodeElement: HTMLElement
  rnd: Rnd
  resizeDir: ResizeDirection
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
