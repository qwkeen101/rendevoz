import { Descendant } from 'slate'
import React from 'react'
import { CustomElement, IDraggableElement, IEditorAISummary, INote, INoteLabel, ISubChat } from '~/typings'

export type IEditorEvent =
  | {
      type: 'getMeta'
      onSuccess: (id: number) => void
      temp?: boolean
    }
  | {
      type: 'updateNote'
      updater: (curr: INote) => INote
    }
  | {
      type: 'removeSummary'
    }
  | {
      type: 'valueChange'
      value: Descendant[]
    }
  | {
      type: 'click'
    }
  | {
      type: 'titleChange'
      value: string
    }
  | {
      type: 'highlight'
      highlightId: number
      labelId: number
    }
  | {
      type: 'drop'
      event: PointerEvent | DragEvent
      draggingElement?: IDraggableElement
    }
  | {
      type: 'addLabel'
      currentLabel: Partial<INoteLabel>
      afterAddValue: Descendant[]
    }
  | {
      type: 'deleteLabel'
      labelId: number | number[]
    }
  | {
      type: 'blur'
    }
  | {
      type: 'labelListChange'
      labels: (current: number[]) => number[]
    }
  | {
      type: 'AI summarize'
      summary: IEditorAISummary
    }
  | {
      type: 'getSource'
    }
  | {
      type: 'chatChange'
      chat: ISubChat | undefined
    }
