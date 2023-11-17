import Id from '@/utils/id'
import { BaseSelection, Editor, Element, Path, Range, Transforms } from 'slate'
import { CustomEditor, CustomElement, DefaultAddElementHandler } from '~/typings'
import { ReactEditor } from '../slate-react'
import { Rendevoz } from '@/core/rendevoz'
import getCursorPosition from '../utils/getCursorPosition'
import { waitFor } from '@/utils/functions'
import { ID_TO_ELEMENT_FUNCTION_MAP } from '../weakMaps'
import FileSystem from '@/api/fileSystem'

export const defaultHandler: DefaultAddElementHandler = (type, instance, mode, opts) => {
  let addElementPath: Path = []
  // let isCurrentElementEmpty = false
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  const { currentAddClickElement } = editor
  if (currentAddClickElement) {
    addElementPath = ReactEditor.findPath(editor, currentAddClickElement)
    addElementPath = Path.next(addElementPath)
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
  switch (type) {
    case 'table':
      // add two columns three rows table
      handleAddTableAtPath(addElementPath, editor)
      break
    case 'link': {
      setTimeout(() => {
        const cursorPosition = getCursorPosition(editor)
        if (cursorPosition) {
          editor.overlayManager?.setContent('linkForm')
          editor.overlayManager?.open()
          editor.overlayManager?.setPosition({
            left: cursorPosition.x,
            top: cursorPosition.y + 5
          })
        }
      })
      break
    }
    case 'synced':
      handleAddSyncedBlock(addElementPath, editor)
      break
    case 'emoji':
      setTimeout(() => {
        const overlayManager = instance.getOverlayManager?.()
        if (overlayManager) {
          overlayManager.setContent('emojiPicker')
          overlayManager.open()
        }
      }, 50)
      return
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
        const firstFile = files as File
        if (firstFile && firstFile.type.startsWith('image')) {
          FileSystem.saveImage(firstFile, { compress: false }).then(data => {
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

const handleAddSyncedBlock = async (path: Path, editor: CustomEditor) => {
  const normalizedElement = await editor.on({ type: 'addNewElementFromMenu', newElementType: 'sync' })
  if (!normalizedElement) return
  Transforms.insertNodes(editor, normalizedElement, { at: path })
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
