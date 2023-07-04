import Id from '@/utils/id'
import { BaseSelection, Editor, Element, Path, Range, Transforms } from 'slate'
import { CustomEditor, CustomElement, DefaultAddElementHandler } from '~/typings'
import { ReactEditor } from '../slate-react'
import { Rendevoz } from '@/core/rendevoz'
import { saveImageLocally } from '@/utils/img'
import getCursorPosition from '../utils/getCursorPosition'
import { GlobalObjectPanelInstance } from '@/core/global'
import { GlobalEventEmitter } from '@/events'
import { waitFor } from '@/utils/functions'
import { ID_TO_ELEMENT_FUNCTION_MAP } from '../weakMaps'

export const defaultHandler: DefaultAddElementHandler = (type, instance, mode, opts) => {
  let addElementPath: Path = []
  // let isCurrentElementEmpty = false
  const editor = instance.getSlateEditor?.()
  if (!editor) return

  const { currentAddClickElement } = editor
  if (currentAddClickElement) {
    addElementPath = ReactEditor.findPath(editor, currentAddClickElement)
    addElementPath = Path.next(addElementPath)
    // isCurrentElementEmpty = Editor.isEmpty(editor, currentAddClickElement)
    // if (isCurrentElementEmpty) {
    //   addElementPath = Path.previous(addElementPath)
    // }
  }
  if (mode === 'slash' && editor.selection && Range.isCollapsed(editor.selection)) {
    checkNeedRemoveSlash(type, editor)
    const currentBlock = Editor.above(editor, {
      match: n => Element.isElement(n)
    })
    if (currentBlock) {
      const [ele, path] = currentBlock
      const isEmpty = Editor.isEmpty(editor, ele)
      if (isEmpty) {
        addElementPath = path
      } else {
        addElementPath = Path.next(path)
      }
    }
  }
  if (!addElementPath.length) return

  // if (isCurrentElementEmpty) {
  //   Transforms.removeNodes(editor, { at: addElementPath })
  // }
  switch (type) {
    case 'table':
      // add two columns three rows table
      handleAddTableAtPath(addElementPath, editor)
      break
    case 'inline-metaObject':
      handleAddInlineMetaObject(editor)
      break
    case 'emoji':
      setTimeout(() => {
        const overlayManager = instance.getOverlayManager?.()
        if (overlayManager) {
          overlayManager.setContent('emojiPicker')
          overlayManager.open()
        }
      }, 50)
      break
    case 'math': {
      const mathId = Id.getId()
      Transforms.insertNodes(editor, {
        id: mathId,
        type: 'math',
        children: [{ text: '' }]
      })
      waitFor(
        () => {
          const openMath = ID_TO_ELEMENT_FUNCTION_MAP.get(editor)?.get(mathId)?.openMathForm
          if (openMath) {
            return true
          }
          return false
        },
        () => {
          ID_TO_ELEMENT_FUNCTION_MAP.get(editor)?.get(mathId)?.openMathForm?.()
        }
      )
      break
    }
    case 'image':
      Rendevoz.Actions.Utils.uploadFile().then(files => {
        const firstFile = files[0]
        if (firstFile && firstFile.type.startsWith('image')) {
          saveImageLocally(firstFile, { compress: false }).then(data => {
            instance.getOverlayManager?.().close()
            Transforms.insertNodes(
              editor,
              {
                type: 'image',
                url: data,
                id: Id.getId(),
                children: [{ text: '' }]
              },
              {
                at: addElementPath
              }
            )
          })
        }
      })
      break
    default:
      Transforms.insertNodes(
        editor,
        {
          id: Id.getId(),
          type,
          children: [{ text: '' }]
        },
        {
          at: addElementPath
        }
      )
      Transforms.select(editor, addElementPath)
  }
  instance.getOverlayManager?.().close()
  ReactEditor.focus(editor)
}

const checkNeedRemoveSlash = (elementType: CustomElement['type'], editor: CustomEditor) => {
  let needRemove = true
  switch (elementType) {
    case 'inline-metaObject':
      needRemove = false
  }
  if (needRemove) {
    removeSlash(editor.selection, editor)
  }
}

const removeSlash = (selection: BaseSelection, editor: CustomEditor) => {
  if (selection) {
    Transforms.delete(editor, {
      at: selection,
      reverse: true,
      unit: 'character',
      distance: 1
    })
  }
}

const handleAddTableAtPath = (path: Path, editor: CustomEditor) => {
  Transforms.insertNodes(
    editor,
    {
      id: Id.getId(),
      type: 'table',
      columns: [
        {
          accessor: 'col1'
        },
        {
          accessor: 'col2'
        }
      ],
      children: [
        {
          type: 'tableRow',
          children: [
            {
              type: 'tableCell',
              id: Id.getId(),
              colName: 'col2',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: ''
                    }
                  ],
                  id: Id.getId()
                }
              ]
            },
            {
              type: 'tableCell',
              colName: 'col1',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: ''
                    }
                  ],
                  id: Id.getId()
                }
              ]
            }
          ]
        },
        {
          type: 'tableRow',
          children: [
            {
              type: 'tableCell',
              colName: 'col1',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: ''
                    }
                  ],
                  id: Id.getId()
                }
              ]
            },
            {
              type: 'tableCell',
              colName: 'col2',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: ''
                    }
                  ],
                  id: Id.getId()
                }
              ]
            }
          ]
        },
        {
          type: 'tableRow',
          children: [
            {
              type: 'tableCell',
              colName: 'col1',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: ''
                    }
                  ],
                  id: Id.getId()
                }
              ]
            },
            {
              type: 'tableCell',
              colName: 'col2',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: ''
                    }
                  ],
                  id: Id.getId()
                }
              ]
            }
          ]
        }
      ]
    },
    {
      at: path
    }
  )
}

const handleAddInlineMetaObject = (editor: CustomEditor) => {
  const { selection } = editor
  if (!selection) return
  const cursorPosition = getCursorPosition(editor)
  const currSelection = structuredClone(selection) as BaseSelection
  if (cursorPosition) {
    GlobalObjectPanelInstance.open?.({
      left: cursorPosition.x + 20,
      top: cursorPosition.y + 20
    })
    GlobalEventEmitter()
      .emitWithCallback('global', {
        type: 'globalChooseMetaObject'
      })
      .then(id => {
        removeSlash(currSelection, editor)
        Transforms.insertNodes(editor, {
          type: 'inline-metaObject',
          originId: id,
          id: Id.getId(),
          children: [{ text: '' }]
        })
        GlobalEventEmitter().emit('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            draggingElement: {
              type: 'metaElement',
              metaId: id
            },
            dropOn: {
              dropOn: 'editor',
              noteId: editor.noteId
            }
          }
        })
      })
  }
}
