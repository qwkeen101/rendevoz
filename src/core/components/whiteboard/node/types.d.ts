import { Box } from '~/typings'

export type NodeEvents =
  | {
      type: 'resize'
      direction: 'x' | 'y' | 'both'
      newBox: Box
    }
  | {
      type: 'drag'
    }
  | {
      type: 'resizeEnd'
    }
  | {
      type: 'resizeStart'
    }

export type NodeEventHandler = (e: NodeEvents) => void
