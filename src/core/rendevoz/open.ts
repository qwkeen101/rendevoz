import { toast } from 'react-hot-toast'
import { GlobalInstances, IEditorInstance, IPdfViewer, IMediaInstance, IWebpageInstance } from '~/typings'
import { ID_TO_LABEL_MAP } from '@/core'
import { globalStore, MetaStore, ObjectStore } from '../../stores'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom, TypeToRegisteredMetaObject } from '../../stores/meta.store'
import { ipcInstance } from '@/plugins'
import { waitFor } from '@/utils/functions'
import { GlobalTextSearchInstance } from '../global/GlobalTextSearch'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'
import { Rendevoz } from '.'
import { GlobalSearchInstance } from '../global/GlobalSearchPanel'
import { setPanelState } from '@/components/layout/sidebar'
import { GlobalInstance } from '@/hooks'

const openMetaObject = async (metaObjectId: number) => {
  const metaObject = globalStore.get(metaObjectsAtom).get(metaObjectId)
  console.log(metaObjectId, metaObject)
  if (!metaObject) {
    toast.error('Target Object Not Exist!')
    return
  }
  const registeredMetaObject = TypeToRegisteredMetaObject.get(metaObject.type)
  if (registeredMetaObject?.onNavigate) {
    registeredMetaObject.onNavigate(metaObject)
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
    case 'image':
    case 'videoLabel':
    case 'video':
    case 'audio':
    case 'audioLabel':
    case 'syncedBlock':
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
  console.log(metaObject)
  updateViewAt(objectId)
  switch (metaObject.type) {
    case 'noteBlock':
      return openNoteBlock(objectId)
    case 'note':
    case 'normal':
      return openEditor(objectId)
    case 'pdf':
      return openPdf(objectId)
    case 'pdfLabel':
      return openPdfLabel(objectId)
    case 'whiteboard':
      return openWhiteboard(objectId)
    case 'webpage':
      return openWebpage(objectId)
    case 'webpageLabel':
      return openWebpageLabel(objectId)
    case 'noteLabel':
      return openNoteLabel(objectId)
    case 'image':
      return openImage(objectId)
    case 'localFile':
      return openLocalFile(objectId)
    case 'audio':
      return openAudio(objectId)
    case 'video':
      return openVideo(objectId)
    case 'videoLabel':
      return openVideoLabel(objectId)
    case 'audioLabel':
      return openAudioLabel(objectId)
    // case 'syncedBlock':
    //   return openSyncedEditor(metaObjectId)
  }
}

const openAudioLabel = async (objectId: number) => {
  const label = await ObjectStore('audioLabel').getOneById(objectId)
  if (label && label.parentObjectId) {
    const i = await openAudio(label.parentObjectId)
    if (i) {
      i.actionOps?.jumpTo?.(label.time)
    }
  }
}
const openRendevozLink = async (link: string) => {
  if (link.startsWith('rendevoz://object')) {
    const url = new URL(link)
    const query = url.searchParams
    const pathname = url.pathname
    const metaId = parseInt(pathname.replace('//object/', ''))
    console.log(metaId)
    if (!metaId || metaId.toString().length !== 14) {
      return
    }
    if (query.has('t')) {
      const mediaObject = await MetaStore.getMetaObjectById(metaId)
      if (!mediaObject || !mediaObject.objectId) return
      await openMediaAtTime(mediaObject.objectId, mediaObject.type, parseInt(query.get('t')))
    } else {
      await openMetaObject(metaId)
    }
  }
  if (link.startsWith('rendevoz://baidudisk')) {
    const url = new URL(link)
    const search = url.searchParams

    if (search.has('code')) {
      ipcInstance.send('loginBaidudisk', search.get('code')).then(res => {
        if (res) {
          localStorage.setItem('bda', res.data.access_token)
          toast.success('登录网盘成功！')
        }
      })
    }
  }
  return
}
const openLocalFile = async (fileId: number) => {
  const localFile = await ObjectStore('localFile').getOneById(fileId)
  if (localFile && localFile.fileUrl) {
    return ipcInstance.send('openLocalFile', localFile.fileUrl)
  }
}

const openSyncedEditor = (syncMetaId: number) => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'synced',
        objectId: syncMetaId
      }
    })
    MetaStore.updateMetaObject({ id: syncMetaId, viewAt: Date.now() }, true)
  })
}
const openAudio = async (audioId: number): Promise<IMediaInstance> => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab?.({
      data: {
        type: 'audio',
        objectId: audioId,
        onInstanceInitialized: (i: IMediaInstance) => res(i)
      }
    })
    updateViewAt(audioId)
  })
}
const openEditor = (noteId: number): Promise<IEditorInstance> => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab?.({
      data: {
        type: 'note',
        objectId: noteId,
        onInstanceInitialized: (i: IEditorInstance) => res(i)
      }
    })
    updateViewAt(noteId)
  })
}

const openWebpage = (webpageId: number): Promise<IWebpageInstance> => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'webpage',
        objectId: webpageId,
        onInstanceInitialized: (i: IWebpageInstance) => res(i)
      }
    })
  })
}

const openWebpageLabel = async (labelId: number) => {
  const webpageLabel = await ObjectStore('webpageLabel').getOneById(labelId)
  if (webpageLabel) {
    const webpage = await openWebpage(webpageLabel.parentObjectId)
    await webpage.editorInstance?.labelOps?.scrollToLabel(labelId)
  }
}

const openNoteBlock = async (blockId: number) => {
  const block = await ObjectStore('noteBlock').getOneById(blockId)
  if (block) {
    updateViewAt(blockId)
    const editor = await openEditor(block.noteId)
    if (editor) {
      editor.selectBlock?.({ blockId })
    }
  }
}

const openPdf = (pdfId: number): Promise<IPdfViewer> => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab?.({
      data: {
        type: 'pdf',
        objectId: pdfId,
        onInstanceInitialized: (i: IPdfViewer) => res(i)
      }
    })
    updateViewAt(pdfId)
  })
}

const openImage = (imageId: number) => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'image',
        objectId: imageId
      }
    })
    updateViewAt(imageId)
    res(null)
  })
}

const openPdfPage = async (page: number, pdfId: number) => {
  const pdf = await openPdf(pdfId)
  pdf.jumpToPage?.(page)
}

const openPdfLabel = async (labelId: number) => {
  const label = await ObjectStore('pdfLabel').getOneById(labelId)
  if (label) {
    updateViewAt(labelId)
    const pdfId = label.parentObjectId
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

const openPdfSearchedText = async (text: string, pageIndex: number, pdfId: number) => {
  const pdf = await openPdf(pdfId)

  if (pdf) {
    waitFor(
      () => !!(pdf.jumpToPage && pdf.highlightText),
      () => {
        pdf.jumpToPage?.(pageIndex)
        pdf.highlightText?.(text, pageIndex)
      }
    )
  }
}

const openHome = () => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'home'
      }
    })
    res(null)
  })
}
const openDatabase = () => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'database'
      }
    })
    res(null)
  })
}
const openWhiteboard = (whiteboardId: number) => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'whiteboard',
        objectId: whiteboardId
      }
    })
    res(null)
    updateViewAt(whiteboardId)
  })
}

const openNoteLabel = async (labelId: number) => {
  const noteLabel = await ObjectStore('noteLabel').getOneById(labelId)
  if (noteLabel) {
    const targetEditor = await openEditor(noteLabel.parentObjectId)
    if (targetEditor) {
      console.log(targetEditor)
      targetEditor.scrollToHighlight?.({ highlightId: labelId })
    }
  }
}

const updateViewAt = (objectId: number) => {
  const metaId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(objectId)

  if (metaId) {
    MetaStore.updateMetaObject({ id: metaId, viewAt: Date.now() }, true)
  }
}

const openTextSearch = (opts?: Parameters<GlobalInstances.TextSearchInstance['open']>[0]) => {
  GlobalTextSearchInstance.open?.(opts)
}

const openWebSearch = (opts: Parameters<GlobalInstances.WebSearchInstance['open']>[0]) => {
  GlobalSearchInstance.open?.(opts)
}

const openTranslate = (opts: Parameters<GlobalInstances.TranslateInstance['open']>[0]) => {
  GlobalTranslateInstance.open?.(opts)
}

const openVideo = (videoId: number): Promise<IMediaInstance> => {
  return new Promise(res => {
    Rendevoz.Actions.Layout.openNewTab({
      data: {
        type: 'video',
        objectId: videoId,
        onInstanceInitialized: (i: IMediaInstance) => res(i)
      }
    })
    updateViewAt(videoId)
  })
}

const openMediaAtTime = async (id: number, type: string, time: number) => {
  let i
  if (type === 'audio') {
    i = await openAudio(id)
  }
  if (type === 'video') {
    i = await openVideo(id)
  }
  if (i) {
    const ins = i as IMediaInstance
    waitFor(
      () => !!ins.actionOps?.jumpTo,
      () => ins.actionOps?.jumpTo(time),
      {
        timeout: 15000
      }
    )
  }
}
const openVideoLabel = async (labelId: number) => {
  const label = await ObjectStore('videoLabel').getOneById(labelId)
  if (label) {
    openMediaAtTime(label.parentObjectId, 'video', label.time)
  }
}
const openEditMetaDialog = (metaId: number) => {
  Rendevoz.Events.Emit.GlobalEventEmitter.emit('global', {
    type: 'globalNeedEditMetaObject',
    data: {
      metaObjectId: metaId
    }
  })
}
const Open: typeof Rendevoz.Actions.Open = {
  Pdf: {
    openPdf,
    openPdfLabel,
    openPdfPage,
    openPdfSearchedText
  },
  Editor: {
    openEditor,
    openNoteBlock,
    openNoteLabel
  },
  Whiteboard: {
    openWhiteboard
  },
  Meta: {
    openMetaObject,
    openEditMetaDialog
  },
  Webpage: {
    openWebpage,
    openWebpageLabel
  },
  Video: {
    openVideo,
    openVideoLabel,
    openVideoAtTime: openMediaAtTime
  },
  Search: {
    openTextSearch,
    openWebSearch
  },
  Translate: {
    openTranslate
  },
  openHome,
  openDatabase,
  openImage,
  openRendevozLink,
  openSidebarObjectDetails: id => {
    console.log(id)
    GlobalInstance.metaOps?.openDetails(id)
  }
}

export default Open
