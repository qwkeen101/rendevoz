import { toast } from 'react-hot-toast'
import { CustomEditor, WebpageInstance } from '~/typings'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP, ID_TO_LABEL_MAP } from '@/core'
import { GlobalLayout } from '../components/layout'
import { IPdfViewer } from '~/typings'
import { globalStore, MetaStore, ObjectStore } from '../stores'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom } from '../stores/meta.store'
import { TextItem } from 'pdfjs-dist/types/src/display/api'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { getIndexesOfMatchStr } from '@/utils/str'
import { goToBlock, waitForEditorContentInitialized } from './editor/utils/blockActions'
import { goToTextHighlight } from './editor/utils'

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
    case 'note':
    case 'pdf':
    case 'webpage':
    case 'webpageLabel':
    case 'pdfLabel':
    case 'noteLabel':
    case 'noteBlock':
    case 'whiteboard': {
      const one = await ObjectStore(metaObject.type).getOneById(objectId)
      if (!one) {
        hasTarget = false
      }
      break
    }
    case 'normal': {
      const note = await ObjectStore('note').getOneById(objectId)
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
  updateViewAt(objectId)
  switch (metaObject.type) {
    case 'noteBlock':
      return goToNoteBlock(objectId)
    case 'note':
    case 'normal':
      return openEditor(objectId)
    case 'pdf':
      return openPdf(objectId)
    case 'pdfLabel':
      return goToPdfLabel(objectId)
    case 'whiteboard':
      return openWhiteboard(objectId)
    case 'webpage':
      return openWebpage(objectId)
    case 'webpageLabel':
      return goToWebpageLabel(objectId)
    case 'noteLabel':
      return goToNoteLabel(objectId)
  }
}

const openEditor = (noteId: number): Promise<CustomEditor> => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'note',
      noteId,
      onEditorInitalized: editor => res(editor)
    })
    updateViewAt(noteId)
  })
}

const openWebpage = (webpageId: number): Promise<WebpageInstance> => {
  return new Promise(res => {
    GlobalLayout?.addTab({
      type: 'webpage',
      webpageId,
      onWebpageInitialized: i => res(i)
    })
  })
}

const goToWebpageLabel = async (labelId: number) => {
  const webpageLabel = await ObjectStore('webpageLabel').getOneById(labelId)
  if (webpageLabel) {
    const webpage = await openWebpage(webpageLabel.webpageId)
    const editor = await webpage.transformToNote()
    await waitForEditorContentInitialized(editor)
    goToTextHighlight(webpageLabel.highlightId, editor)
  }
}

const goToNoteBlock = async (blockId: number) => {
  const block = await ObjectStore('noteBlock').getOneById(blockId)
  if (block) {
    updateViewAt(blockId)
    const editor = await openEditor(block.noteId)
    goToBlock(blockId, editor)
  }
}

const highlightNoteBlock = async (blockId: number, editor: CustomEditor) => {
  const path = ID_TO_PATH_MAP.get(editor)?.get(blockId)
  SELECTED_BLOCKS_MAP.get(editor)?.set(blockId, null)
  ID_TO_ELEMENTS_MAP.get(editor)?.get(blockId)?.selectBlock()

  if (path) {
    editor.innerRef?.current.scrollTo(path[0])
  } else {
    editor.onContentRendered = () => {
      const path = ID_TO_PATH_MAP.get(editor)?.get(blockId)
      path && editor.innerRef?.current.scrollTo(path[0])
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
    updateViewAt(pdfId)
  })
}
const goToPdfPage = async (page: number, pdfId: number) => {
  const pdf = await openPdf(pdfId)
  pdf.jumpToPage?.(page)
}
const goToPdfLabel = async (labelId: number) => {
  const label = await ObjectStore('pdfLabel').getOneById(labelId)
  if (label) {
    updateViewAt(labelId)
    const pdfId = label.documentId
    if (pdfId) {
      const viewer = await openPdf(pdfId)
      setTimeout(() => {
        viewer.jumpToLabel?.(labelId)
      }, 100)
      if (ID_TO_LABEL_MAP.get(viewer)?.has(labelId)) {
        ID_TO_LABEL_MAP.get(viewer)?.get(labelId)?.focus()
      } else {
        viewer.onLabelRendered = l => {
          if (l === labelId) {
            ID_TO_LABEL_MAP.get(viewer)?.get(labelId)?.focus()
          }
        }
      }
    }
  }
}
// for search engine
const goToPdfSearchPositions = async (
  positions: {
    start: number
    length: number
  }[],
  pageIndex: number,
  pdfId: number
) => {
  const pdf = await openPdf(pdfId)

  if (pdf) {
    const doc = pdf.getPdfInstance?.()
    if (doc) {
      const page = await doc.getPage(pageIndex + 1)
      const textContent = await page.getTextContent()
      const searchableText = textContent.items.map(i => ('str' in i ? i : undefined)).filter(i => i !== undefined) as ({
        start?: number
        end?: number
      } & TextItem)[]
      searchableText.forEach((v, idx, arr) => {
        const curr = v
        const prev = idx > 0 && arr[idx - 1]
        if (prev && prev.end) {
          curr.start = prev.end + 1
          curr.end = curr.start + curr.str.length
        } else {
          curr.start = 0
          curr.end = curr.str.length
        }
      })
      // get all indexes of searched text
      // get target text item
      const items = positions.map(({ start, length }) => {
        const endIndex = start + length - 1
        const allTextItems: TextItem[] = []
        let startIdx: number
        let endIdx: number
        searchableText.forEach((i, idx) => {
          if (idx > endIdx) return
          if (startIdx !== undefined) {
            allTextItems.push(i)
          }
          // get start idx and push first item into arr
          if (start >= i.start! && start <= i.end!) {
            startIdx = idx
            allTextItems.push(i)
          }
          // get end idx
          if (endIndex >= i.start! && endIndex <= i.end!) {
            endIdx = idx
          }
        })
        return allTextItems
      })
      console.log(items)
    }
  }
}
const goToPdfSearchedText = async (text: string, pageIndex: number, pdfId: number) => {
  const pdf = await openPdf(pdfId)

  if (pdf) {
    const doc = await pdf.getDocument?.()
    if (doc) {
      pdf.jumpToPage?.(pageIndex)
      const page = await doc.getPage(pageIndex + 1)
      const textContent = await page.getTextContent()
      const searchableText = textContent.items.map(i => ('str' in i ? i : undefined)).filter(i => i !== undefined) as ({
        start?: number
        end?: number
      } & TextItem)[]
      const joinedText = searchableText.map(i => i.str).join(' ')
      searchableText.forEach((v, idx, arr) => {
        const curr = v
        const prev = idx > 0 && arr[idx - 1]
        if (prev && prev.end) {
          curr.start = prev.end + 1
          curr.end = curr.start + curr.str.length
        } else {
          curr.start = 0
          curr.end = curr.str.length
        }
      })
      // get all indexes of searched text
      const indexes = getIndexesOfMatchStr(text, joinedText)
      const searchTextLength = text.length
      // get target text item
      const items = indexes.map(index => {
        const endIndex = index + searchTextLength - 1
        const allTextItems: TextItem[] = []
        let startIdx: number
        let endIdx: number
        searchableText.forEach((i, idx) => {
          if (idx > endIdx) return
          if (startIdx !== undefined) {
            allTextItems.push(i)
          }
          // get start idx and push first item into arr
          if (index >= i.start! && index <= i.end!) {
            startIdx = idx
            allTextItems.push(i)
          }
          // get end idx
          if (endIndex >= i.start! && endIndex <= i.end!) {
            endIdx = idx
          }
        })
        return allTextItems
      })
      pdf.getTextLayerInstance?.(pageIndex).then(ins => {
        items.forEach(i => ins.paintItems(i, '#FBF719'))
      })
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
    updateViewAt(whiteboardId)
  })
}
const goToNoteLabel = async (labelId: number, editor?: CustomEditor) => {
  const noteLabel = await ObjectStore('noteLabel').getOneById(labelId)
  if (noteLabel) {
    const targetEditor = await (editor || openEditor(noteLabel.noteId))
    await waitForEditorContentInitialized(targetEditor)
    goToTextHighlight(noteLabel.id, targetEditor)
  }
}
const updateViewAt = (objectId: number) => {
  const metaId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(objectId)
  if (metaId) {
    MetaStore.updateMetaObject({ id: metaId, viewAt: Date.now() }, true)
  }
}
const Actions = {
  openEditor,
  goToNoteBlock,
  openPdf,
  goToPdfLabel,
  openHome,
  openDatabase,
  openWhiteboard,
  navigateToTargetObject,
  openWebpage,
  openWebpageLabel: goToWebpageLabel,
  highlightNoteBlock,
  goToPdfPage,
  goToPdfSearchedText,
  goToPdfSearchPositions,
  goToNoteLabel
}

export default Actions
