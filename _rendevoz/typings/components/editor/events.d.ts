import { Descendant } from 'slate'
import React from 'react'
import { CustomElement, EditorProps, IDraggableElement, INoteBlock, INoteLabel } from '~/typings'

export type IEditorEvent =
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
      type: 'stateChange'
      event:
        | {
            type: 'containerWidth'
            widthType: 'full' | 'default'
          }
        | {
            type: 'typeface'
            typeface: Required<EditorProps>['state']['typeface']
          }
        | {
            type: 'fontSize'
            fontSize: number
          }
        | {
            type: 'lineSpacing'
            lineSpacing: number
          }
        | {
            type: 'pageWidth'
            width: Required<EditorProps>['state']['pageWidth']
          }
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
      type: 'save'
      value: Descendant[]
    }
