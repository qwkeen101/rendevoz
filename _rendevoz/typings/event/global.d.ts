import { CustomTypes } from '..'

export type BuiltInDropOn =
  | {
      dropOn: 'editor'
      noteId: number
    }
  | {
      dropOn: 'whiteboard'
      whiteboardId: number
    }
  | {
      dropOn: 'attachment'
      parentMetaId: number
    }
  | {
      dropOn: 'metaObject'
      metaId: number
    }

export type DropOn = CustomTypes['DropOn']