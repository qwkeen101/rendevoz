import Id from '@/utils/id'
import { Editor, Path, Transforms } from 'slate'
import { CustomEditor, CustomElement, DefaultAddElementHandler, IEditorInstance } from '~/typings'
import { ReactEditor } from '../slate-react'
import { waitFor } from '@/utils/functions'
import FileSystem from '@/api/fileSystem'
import { ObjectStore } from '@/api/stores'
import IsInline from '@/core/components/editor/utils/isInline'

export const defaultHandler: DefaultAddElementHandler = (type, instance) => {
  // let isCurrentElementEmpty = false
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  const selectionBlock = instance.blockOps?.getAboveBlock()
  if (!selectionBlock) throw new Error('No selected node!')
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
  let addElementPath = selectionBlock[1]
  const isInline = IsInline(type)
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
      return
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
      handleAddSyncedBlock(addElementPath, editor, instance)
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
    case 'math':
    case 'math-block': {
      const mathId = Id.getId()
      Transforms.insertNodes(editor, {
        id: mathId,
        type: type,
        children: [{ text: '' }]
      })
      waitFor(
        () => {
          const openMath = instance.blockOps?.getBlockFuncs(mathId)?.openMathForm
          if (openMath) {
            return true
          }
          return false
        },
        () => {
          instance.blockOps?.getBlockFuncs(mathId)?.openMathForm?.()
        }
      )
      break
    }
    case 'image':
      ReactEditor.blur(editor)
      Global.commonOps
        ?.upload({
          accept: 'image/*'
        })
        .then(files => {
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

const handleAddSyncedBlock = async (path: Path, editor: CustomEditor, instance: IEditorInstance) => {
  const metaId = instance.values.metaId
  if (metaId) {
    const syncedBlockMeta = (
      await ObjectStore('syncedBlock').addOneWithMeta(
        {
          syncVersion: 1,
          syncedMetaIds: [metaId],
          blockChildren: [{ type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }]
        },
        { silent: true }
      )
    ).meta
    Transforms.insertNodes(
      editor,
      {
        type: 'synced',
        children: [{ text: '' }],
        syncVersion: 0,
        originId: syncedBlockMeta.id,
        id: Id.getId()
      },
      { at: path }
    )
    setTimeout(() => {
      Transforms.select(editor, Editor.start(editor, [...path, 0]))
      ReactEditor.focus(editor)
    })
    return
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
              colName: 'col1',
              id: Id.getId(),
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
              id: Id.getId(),
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
              id: Id.getId(),
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
              id: Id.getId(),
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
              id: Id.getId(),
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
