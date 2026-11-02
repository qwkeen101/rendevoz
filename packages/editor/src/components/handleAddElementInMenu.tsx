import Id from './utils/id'
import { Editor, Path, Transforms } from 'slate'
import { CustomEditor, CustomElement, DefaultAddElementHandler, IEditorInstance } from '~/typings'
import { ReactEditor } from '../slate-react'
import { waitFor } from '../utils/functions'
import FileSystem from '@/api/fileSystem'
import IsInline from '../utils/isInline'

export const defaultHandler: DefaultAddElementHandler = (type, instance) => {
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  const selectionBlock = instance.blockOps?.getAboveBlock()
  if (!selectionBlock) throw new Error('No selected node!')
  let isCurrentBlockEmpty = false
  const searchFilterValue = '/' + (instance.overlayOps?.getState().currentFilterValue ?? '')
  if (selectionBlock[0].type === 'paragraph' && selectionBlock[0].children.length === 1) {
    const firstText = selectionBlock[0].children[0].text as string
    if (firstText === '' || firstText === searchFilterValue) {
      isCurrentBlockEmpty = true
    }
  }
  let addElementPath = selectionBlock[1]
  const isInline = IsInline(type)
  if (isCurrentBlockEmpty && !isInline) {
    Transforms.removeNodes(editor, { at: selectionBlock[1] })
  } else {
    Transforms.delete(editor, { distance: searchFilterValue.length, unit: 'character', reverse: true })
    addElementPath = Path.next(addElementPath)
  }
  let addedElement: undefined | CustomElement = undefined
  switch (type) {
    case 'table':
      handleAddTableAtPath(addElementPath, editor)
      return
    case 'link': {
      instance.overlayOps?.close()
      setTimeout(() => {
        const pos = instance.blockOps?.getCurrentCursorBounding()
        if (pos) {
          instance.overlayOps?.open('linkForm', { x: pos.x, y: pos.y + pos.height / 2 })
        }
      }, 350)
      return
    }
    case 'synced':
      instance.overlayOps?.close()
      return
    case 'emoji': {
      instance.overlayOps?.close()
      setTimeout(() => {
        const pos = instance.blockOps?.getCurrentCursorBounding()
        if (pos) {
          instance.overlayOps?.open('emojiPicker', { x: pos.x, y: pos.y + pos.height / 2 })
        }
      }, 350)
      return
    }
    case 'iframe': {
      const id = Id.getId()
      ReactEditor.blur(editor)
      Transforms.insertNodes(editor, { id, type: 'iframe', children: [{ text: '' }] }, { at: addElementPath })
      waitFor(
        () => !!instance.blockOps?.getBlockFuncs(id)?.openTypeUrlForm,
        () => {
          instance.blockOps?.getBlockFuncs(id)?.openTypeUrlForm?.()
        }
      )
      return
    }
    case 'math':
    case 'math-block': {
      const mathId = Id.getId()
      Transforms.insertNodes(editor, { id: mathId, type: type, children: [{ text: '' }] })
      waitFor(
        () => !!instance.blockOps?.getBlockFuncs(mathId)?.openMathForm,
        () => {
          instance.blockOps?.getBlockFuncs(mathId)?.openMathForm?.()
        }
      )
      break
    }
    case 'image':
      ReactEditor.blur(editor)
      Global.commonOps
        ?.upload({ accept: 'image/*' })
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
                { at: addElementPath }
              )
            })
          }
        })
      break
    default:
      addedElement = { id: Id.getId(), type, children: [{ text: '' }] }
      Transforms.insertNodes(editor, addedElement, { at: addElementPath })
      Transforms.select(editor, addElementPath)
  }
  instance.overlayOps?.close()
  ReactEditor.focus(editor)
  if (addedElement) {
    postHandler(addedElement, addElementPath, editor, instance)
  }
}

const handleAddSyncedBlock = async (_path: Path, _editor: CustomEditor, _instance: IEditorInstance) => {}

const handleAddTableAtPath = (path: Path, editor: CustomEditor) => {
  Transforms.insertNodes(
    editor,
    {
      id: Id.getId(),
      type: 'table',
      columns: [{ accessor: 'col1' }, { accessor: 'col2' }],
      children: [
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', colName: 'col1', children: [{ text: '' }] },
            { type: 'tableCell', colName: 'col2', children: [{ text: '' }] }
          ]
        },
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', colName: 'col1', children: [{ text: '' }] },
            { type: 'tableCell', colName: 'col2', children: [{ text: '' }] }
          ]
        }
      ]
    },
    { at: path }
  )
  Transforms.select(editor, Editor.start(editor, [...path, 0]))
}

const postHandler = (element: CustomElement, path: Path, editor: CustomEditor, instance: IEditorInstance) => {
  if (element.type === 'code-block') {
    setTimeout(() => {
      const elementDom = ReactEditor.toDOMNode(editor, Element.isElement(element) ? element : (element as any))
      const select = elementDom.querySelector('select') as HTMLSelectElement
      select?.focus()
    }, 100)
  }
  if (element.type === 'image') {
    setTimeout(() => {
      const elementDom = ReactEditor.toDOMNode(editor, element as any)
      const imageDom = elementDom.querySelector('img')
      if (imageDom) {
        const width = imageDom.offsetWidth
        const imageBounding = imageDom.getBoundingClientRect()
        instance.overlayOps?.open('imageToolbar', {
          width: width,
          x: imageBounding.x,
          y: imageBounding.y,
          id: (element as any).id
        })
      }
    }, 100)
  }
  if (element.type === 'image' && instance.values.displayMode === 'note') {
    instance.on?.({
      type: 'updateNote',
      updater: note => ({ ...note, coverImgSrc: (element as any).url })
    })
    return
  }
  if (['math', 'math-block'].includes(element.type)) {
    setTimeout(() => {
      const elementDom = ReactEditor.toDOMNode(editor, element as any)
      const currentSelection = editor.selection
      if (!currentSelection) return
      const lastTarget = Editor.before(editor, path)
      const focusPath = lastTarget ?? Editor.start(editor, currentSelection.focus.path)
      if (!focusPath) return
      const mathEditorInput = elementDom.querySelector('textarea.mathInput')
      if (mathEditorInput) {
        mathEditorInput.focus()
      }
      const toFocus = Editor.before(editor, [...path, 0])
      if (!toFocus) return
      Transforms.insertNodes(
        editor,
        {
          type: 'paragraph',
          id: Id.getId(),
          children: [{ text: '' }]
        },
        {
          at: toFocus,
          select: true
        }
      )
    })
  }
}
