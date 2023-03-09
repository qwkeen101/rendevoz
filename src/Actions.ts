import { toast } from 'react-hot-toast'
import { CustomEditor } from './components/editor/types'
import { ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from './components/editor/weakMaps'
import { GlobalLayout } from './components/layout'
import { IPdfViewer } from './pdfViewer/core/types/pdfViewer'
import { DocumentStore, globalStore, LabelStore, NoteStore, WhiteboardStore } from './stores'
import useBlockStore from './stores/block.store'
import { metaObjectsAtom } from './stores/meta.store'

const navigateToTargetObject = async (metaObjectId: number) => {
  const metaObject = globalStore.get(metaObjectsAtom).get(metaObjectId)
  if (!metaObject) {
    toast.error('Target Object Not Exist!')
    return
  }
  if (!metaObject.objectId) {
    toast.error('This Object Has No Related Item!')
    return
  }
  const { objectId } = metaObject
  let hasTarget = true
  switch (metaObject.type) {
    case 'note': {
      const note = await NoteStore.getNoteById(objectId)
      if (!note) {
        hasTarget = false
      }
      break
    }
    case 'noteElement': {
      const block = await NoteStore.getBlockById(objectId)
      if (!block) {
        hasTarget = false
        break
      }
      const note = await NoteStore.getNoteById(block.noteId)
      if (!note) {
        hasTarget = false
      }
      break
    }
    case 'pdf': {
      const pdf = await DocumentStore.getDocumentById(objectId)
      if (!pdf) {
        hasTarget = false
      }
      break
    }
    case 'pdfElement': {
      const label = await LabelStore.getLabelById(objectId)
      if (!label || !label.documentId) {
        hasTarget = false
        break
      }
      const pdf = await DocumentStore.getDocumentById(label.documentId)
      if (!pdf) {
        hasTarget = false
      }
      break
    }
    case 'whiteboard': {
      const whiteboard = await WhiteboardStore.getWhiteboardById(objectId)
      if (!whiteboard) {
        hasTarget = false
      }
      break
    }
    case 'normal': {
      const note = await NoteStore.getNoteById(objectId)
      if (!note) {
        hasTarget = false
      }
      break
    }
  }
  if (hasTarget === false) {
    toast.error('Target Item Not Exist!')
    return
  }
  switch (metaObject.type) {
    case 'noteElement':
      return goToNoteBlock(objectId)
    case 'note':
    case 'normal':
      return openEditor(objectId)
    case 'pdf':
      return openPdf(objectId)
    case 'pdfElement':
      return goToPdfLabel(objectId)
    case 'whiteboard':
      return openWhiteboard(objectId)
  }
}

const openEditor = (noteId: number): Promise<CustomEditor> => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'note',
      noteId,
      onEditorInitalized: editor => res(editor)
    })
  })
}

const goToNoteBlock = async (blockId: number) => {
  const { getBlockById } = useBlockStore()
  const block = await getBlockById(blockId)
  if (block) {
    const editor = await openEditor(block.noteId)
    const path = ID_TO_PATH_MAP.get(editor)?.get(blockId)
    SELECTED_BLOCKS_MAP.get(editor)?.set(blockId, null)
    if (path) {
      editor.innerRef?.current.scrollTo(path[0])
    }
  }
}

const openPdf = (pdfId: number): Promise<IPdfViewer> => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'pdf',
      pdfId,
      onViewerInitialized: viewer => res(viewer)
    })
  })
}
const goToPdfLabel = async (labelId: number) => {
  const { getLabelById } = LabelStore
  const label = await getLabelById(labelId)
  if (label) {
    const pdfId = label.documentId
    if (pdfId) {
      const viewer = await openPdf(pdfId)
      viewer.currentFocusLabelId = labelId
      label.page && viewer.jumpToPage?.(label.page)
    }
  }
}
const openHome = () => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'home'
    })
    res(null)
  })
}
const openDatabase = () => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'database'
    })
    res(null)
  })
}
const openWhiteboard = (whiteboardId: number) => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'whiteboard',
      whiteboardId
    })
    res(null)
  })
}
const Actions = {
  openEditor,
  goToNoteBlock,
  openPdf,
  goToPdfLabel,
  openHome,
  openDatabase,
  openWhiteboard,
  navigateToTargetObject
}

export default Actions
