import { Descendant } from 'slate'
import React from 'react'
import { CustomElement, EditorProps, IDraggableElement, INote, INoteBlock, INoteLabel, IQuestion } from '~/typings'
import { AISummarizeEvent } from '../../../../src/core/ai/components/AskAIPanel'

export type IEditorEvent =
  | {
      type: 'updateNote'
      updater: (curr: INote) => INote
    }
  | {
      type: 'linkToMeta'
      targetMetaId: number
    }
  | {
      type: 'metaToLink'
      sourceMetaId: number
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
      type: 'linkAddAsValue'
      url: string
    }
  | {
      type: 'highlight'
      highlightId: number
      labelId: number
    }
  | {
      type: 'highlightDrag'
      highlightId: number
    }
  | {
      type: 'copyLink'
      blocks: {
        id: number
        text: string
      }[]
    }
  | {
      type: 'highlightRemove'
      highlightId: number
    }
  | {
      type: 'translate'
      translatedText: string
      blockId: number
      e: React.MouseEvent
    }
  | {
      type: 'search'
      searchedText: string
      blockId: number
      e: React.MouseEvent
    }
  | {
      type: 'linkClick'
      link?: string
      e: React.MouseEvent
    }
  | {
      type: 'contentRetrieved'
    }
  | {
      type: 'drop'
      event: PointerEvent | DragEvent
      draggingElement?: IDraggableElement
    }
  | {
      type: 'addNewElementFromMenu'
      newElementType: CustomElement['type']
    }
  | {
      type: 'addLabel'
      currentLabel: Partial<INoteLabel>
      afterAddValue: Descendant[]
    }
  | {
      type: 'deleteLabel'
      labelId: number
    }
  | {
      type: 'labelDrag'
      labelId: number
    }
  | {
      type: 'blockDragged'
    }
  | {
      type: 'blur'
    }
  | {
      type: 'save'
      value: Descendant[]
    }
  | {
      type: 'AI summarize'
      summary?: string
      questions?: Partial<IQuestion>[]
    }
