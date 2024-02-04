import Id from '@/utils/id'
import { BaseSelection, Editor, Element, Path, Range, Transforms } from 'slate'
import { CustomEditor, CustomElement, DefaultAddElementHandler } from '~/typings'
import { ReactEditor } from '../slate-react'
import { Rendevoz } from '@/core/rendevoz'
import getCursorPosition from '../utils/getCursorPosition'
import { waitFor } from '@/utils/functions'
import { ID_TO_ELEMENT_FUNCTION_MAP } from '../weakMaps'
import FileSystem from '@/api/fileSystem'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'

export const defaultHandler: DefaultAddElementHandler = (type, instance, mode, opts) => {
  // let isCurrentElementEmpty = false
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  const addElement = editor.currentAddClickElement
  const selectionBlock = instance.blockOps?.getAboveBlock()
  if (!selectionBlock) throw new Error('No selected node!')
  console.log(selectionBlock)
  let isCurrentBlockEmpty = false
  const searchFilterValue = '/' + (instance.overlayOps?.getState().currentFilterValue ?? '')
  if (selectionBlock[0].type === 'paragraph' && selectionBlock[0].children.length === 1) {
    const firstText = selectionBlock[0].children[0].text as string
    if (firstText === '') {
      isCurrentBlockEmpty = true
    }
    if (firstText === searchFilterValue) {
      isCurrentBlockEmpty = true
    }
  }
  console.log(isCurrentBlockEmpty, searchFilterValue)
  let addElementPath = selectionBlock[1]
  const isInline = EditorTypeToElementMap.get(type)?.isInline
  if (isCurrentBlockEmpty) {
    Transforms.removeNodes(editor, {
      at: selectionBlock[1]
    })

    if (isInline) {
      Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [{ text: '' }],
        id: Id.getId()
      })
      Transforms.select(editor, selectionBlock[1])
    }
  }
  // remove filter value
  else {
    Transforms.delete(editor, {
      distance: searchFilterValue.length,
      unit: 'character',
      reverse: true
    })
    addElementPath = Path.next(addElementPath)
  }

  switch (type) {
    case 'table':
      // add two columns three rows table
      handleAddTableAtPath(addElementPath, editor)
      break
    case 'link': {
      const pos = instance.blockOps?.getCurrentCursorBlockBounding()
      if (pos) {
        setTimeout(() => {
          instance.overlayOps?.open('linkForm', {
            x: pos.x,
            y: pos.bottom - 10
          })
        })
      }
      break
    }
    case 'synced':
      handleAddSyncedBlock(addElementPath, editor)
      break
    case 'emoji': {
      instance.overlayOps?.close()
      setTimeout(() => {
        const pos = instance.blockOps?.getCurrentCursorBlockBounding()
        if (pos) {
          instance.overlayOps?.open('emojiPicker', {
            x: pos.x,
            y: pos.y + pos.height / 2
          })
        }
      }, 350)
      return
    }
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
  instance.overlayOps?.close()
  ReactEditor.focus(editor)
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
