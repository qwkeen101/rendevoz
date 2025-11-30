import { IWhiteboardInstance } from '../types/instance'
import { IWhiteboard } from '../types/whiteboard'

export type WhiteboardPluginContext = {
  instance: IWhiteboardInstance
  value: IWhiteboard
}

export type WhiteboardPlugin = {
  name: string
  setup: (ctx: WhiteboardPluginContext) => void | (() => void)
}
