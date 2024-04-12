import Id from '@/utils/id'
import { BaseSelection, Editor, Element, Path, Range, Transforms } from 'slate'
import { CustomEditor, CustomElement, DefaultAddElementHandler, IEditorInstance } from '~/typings'
import { ReactEditor } from '../slate-react'
import { Rendevoz } from '@/core/rendevoz'
import { waitFor } from '@/utils/functions'
import { ID_TO_ELEMENTS_MAP } from '../weakMaps'
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
  if (isCurrentBlockEmpty && !isInline) {
    Transforms.removeNodes(editor, {
      at: selectionBlock[1]
    })
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
  let addedElement: undefined | CustomElement = undefined
  switch (type) {
    case 'table':
      // add two columns three rows table
      handleAddTableAtPath(addElementPath, editor)
      break
    case 'link': {
      instance.overlayOps?.close()
      setTimeout(() => {
        const pos = instance.blockOps?.getCurrentCursorBounding()
        if (pos) {
          instance.overlayOps?.open('linkForm', {
            x: pos.x,
            y: pos.y + pos.height / 2
          })
        }
      }, 350)
      return
    }
    case 'synced':
      instance.overlayOps?.close()
      handleAddSyncedBlock(addElementPath, editor)
      return
    case 'emoji': {
      instance.overlayOps?.close()
      setTimeout(() => {
        const pos = instance.blockOps?.getCurrentCursorBounding()
        if (pos) {
          instance.overlayOps?.open('emojiPicker', {
            x: pos.x,
            y: pos.y + pos.height / 2
          })
        }
      }, 350)
      return
    }
    case 'iframe': {
      const id = Id.getId()
      ReactEditor.blur(editor)
      Transforms.insertNodes(
        editor,
        {
          id,
          type: 'iframe',
          children: [{ text: '' }]
        },
        {
          at: addElementPath
        }
      )
      waitFor(
        () => {
          return !!instance.blockOps?.getBlockFuncs(id)?.openTypeUrlForm
        },
        () => {
          instance.blockOps?.getBlockFuncs(id)?.openTypeUrlForm?.()
        }
      )
      return
    }
    case 'math': {
      const mathId = Id.getId()
      console.log(editor.selection)
      Transforms.insertNodes(editor, {
        id: mathId,
        type: 'math',
        children: [{ text: '' }]
      })
      waitFor(
        () => {
          const openMath = ID_TO_ELEMENTS_MAP.get(editor)?.get(mathId)?.openMathForm
          if (openMath) {
            return true
          }
          return false
        },
        () => {
          ID_TO_ELEMENTS_MAP.get(editor)?.get(mathId)?.openMathForm?.()
        }
      )
      break
    }
    case 'image':
      ReactEditor.blur(editor)
      Rendevoz.Actions.Utils.uploadFile({
        accept: 'image/*'
      }).then(files => {
        const firstFile = files as File
        if (firstFile && firstFile.type.startsWith('image')) {
          FileSystem.saveImage(firstFile, { compress: false }).then(data => {
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
      addedElement = {
        id: Id.getId(),
        type,
        children: [{ text: '' }]
      }
      Transforms.insertNodes(editor, addedElement, {
        at: addElementPath
      })
      Transforms.select(editor, addElementPath)
  }
  instance.overlayOps?.close()
  ReactEditor.focus(editor)
  if (addedElement) {
    postHandler(addedElement, addElementPath, editor, instance)
  }
}

const handleAddSyncedBlock = async (path: Path, editor: CustomEditor) => {
  const normalizedElement = await editor.on({ type: 'addNewElementFromMenu', newElementType: 'sync' })
  if (!normalizedElement) return
  console.log(normalizedElement, path)
  Transforms.insertNodes(editor, normalizedElement, { at: path })
  setTimeout(() => {
    Transforms.select(editor, Editor.start(editor, [...path, 0]))
    ReactEditor.focus(editor)
  })
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

const postHandler = (element: CustomElement, path: Path, editor: CustomEditor, instance: IEditorInstance) => {
  if (element.type === 'math-block') {
    waitFor(
      () => !!instance.blockOps?.getBlockFuncs(element.id)?.openMathForm,
      () => {
        instance.blockOps?.getBlockFuncs(element.id)?.openMathForm?.()
      }
    )
  }
}
