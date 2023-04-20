import { WithBorder } from '@/components/base'
import { BasicElements, BlockElements, InlineElements, MediaElements } from '@/core/editor/consts/elements'
import { CustomEditor, MetaObject } from '~/typings'
import EditorElementsMenu, { EditorSlashElementsMenu } from '@/core/editor/components/EditorElementsMenu'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { ChangeEventHandler, useRef } from 'react'
import { BaseSelection, Editor, Element, Path, Range, Transforms } from 'slate'
import { ReactEditor } from '../../../slate-react'
import { EditorOverlayManager } from '../useEditorOverlay'
import { GlobalEventEmitter } from '@/events'
import { GlobalObjectPanelInstance } from '@/core/global'
import getCursorPosition from '@/core/editor/utils/getCursorPosition'

const EditorOverlayElements = ({
  editor,
  manager,
  mode
}: {
  editor: CustomEditor
  manager: EditorOverlayManager
  mode: 'block' | 'slash'
}) => {
  const addElementPathRef = useRef<Path>()
  const handleUploadFile: ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image')) {
        saveImageLocally(Id.getStrId(), file).then(data => {
          manager.close()
          Transforms.insertNodes(
            editor,
            {
              type: 'image',
              url: data.data,
              id: Id.getId(),
              children: [{ text: '' }]
            },
            {
              at: addElementPathRef.current
            }
          )
        })
      }
    }
  }
  const removeSlash = (selection: BaseSelection) => {
    if (selection) {
      Transforms.delete(editor, {
        at: selection,
        reverse: true,
        unit: 'character',
        distance: 1
      })
    }
  }
  const checkNeedRemoveSlash = (elementName: string) => {
    let needRemove = true
    switch (elementName) {
      case InlineElements.InlineMetaObject:
        needRemove = false
    }
    if (needRemove) {
      removeSlash(editor.selection)
    }
  }
  const handleAddElement = (elementName: string) => {
    checkNeedRemoveSlash(elementName)
    const { currentAddClickElement } = editor
    let addElementPath: Path = []
    let isCurrentElementEmpty = false
    if (currentAddClickElement) {
      addElementPath = ReactEditor.findPath(editor, currentAddClickElement)
      addElementPath = Path.next(addElementPath)
      isCurrentElementEmpty = Editor.isEmpty(editor, currentAddClickElement)
      if (isCurrentElementEmpty) {
        addElementPath = Path.previous(addElementPath)
      }
    }
    if (mode === 'slash' && editor.selection && Range.isCollapsed(editor.selection)) {
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
    addElementPathRef.current = addElementPath
    if (isCurrentElementEmpty) {
      Transforms.removeNodes(editor, { at: addElementPath })
    }

    if (Object.values(BasicElements).some(i => i === elementName) || Object.values(BlockElements).some(i => i === elementName)) {
      switch (elementName) {
        case 'table':
          // add two columns three rows table
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
              at: addElementPath
            }
          )
          break
        default:
          Transforms.insertNodes(
            editor,
            {
              id: Id.getId(),
              type: elementName,
              children: [{ text: '' }]
            },
            {
              at: addElementPath
            }
          )
      }

      if (elementName !== BlockElements.Table) {
        Transforms.select(editor, addElementPath)
      }
      ReactEditor.focus(editor)
      manager.close()
      return
    }
    if (Object.values(InlineElements).some(i => i === elementName)) {
      manager.close()
      switch (elementName) {
        case InlineElements.InlineMetaObject: {
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
                removeSlash(currSelection)
                Transforms.insertNodes(editor, {
                  type: 'inline-metaObject',
                  originId: id,
                  id: Id.getId(),
                  children: [{ text: '' }]
                })
                GlobalEventEmitter().emit('global',{
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
          return
        }
        case InlineElements.Emoji: {
          Transforms.insertNodes(
            editor,
            {
              id: Id.getId(),
              type: BasicElements.Paragraph,
              children: [{ text: '' }]
            },
            {
              at: addElementPath
            }
          )
          Transforms.setSelection(editor, Editor.range(editor, addElementPath, Editor.end(editor, addElementPath)))
          setTimeout(() => {
            manager.setContent('emojiPicker')
            manager.open()
          }, 50)
          return
        }
      }
    }
    if (Object.values(MediaElements).some(i => i === elementName)) {
      fileUploaderRef.current?.click()
    }
  }
  const fileUploaderRef = useRef<HTMLLabelElement>(null)
  return (
    <>
      <WithBorder>
        {mode === 'block' ? (
          <EditorElementsMenu onAddElement={handleAddElement} />
        ) : (
          <EditorSlashElementsMenu onAddElement={handleAddElement} />
        )}
      </WithBorder>
      <input type="file" name={`file_${editor.id}`} id={`file_${editor.id}`} style={{ display: 'none' }} onChange={handleUploadFile} />
      <label ref={fileUploaderRef} htmlFor={`file_${editor.id}`} />
    </>
  )
}

export default EditorOverlayElements
