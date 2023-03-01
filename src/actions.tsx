import { toast } from 'react-hot-toast'
import { CustomEditor } from './components/editor/types'
import { ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from './components/editor/weakMaps'
import { GlobalLayout } from './components/layout'
import { IPdfViewer } from './pdfViewer/core/types/pdfViewer'
import { globalStore, LabelStore } from './stores'
import useBlockStore from './stores/block.store'
import { metaObjectsAtom } from './stores/meta.store'
import { notesAtom } from './stores/note.store'
import Id from './utils/id'

const navigateToTargetObject = (metaObjectId: number) => {
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
      const note = globalStore.get(notesAtom).get(objectId)
      if (!note) {
        hasTarget = false
      }
      break
    }
    case 'noteElement': {
      break
    }
    case 'pdf': {
      break
    }
    case 'pdfElement': {
      break
    }
    case 'whiteboard': {
      break
    }
    case 'normal': {
      break
    }
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
const Actions = {
  openEditor,
  goToNoteBlock,
  openPdf,
  goToPdfLabel
}

export default Actions
