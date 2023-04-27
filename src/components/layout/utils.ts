import { AddTabOptions, LayoutTab } from './types'

export const getTabObjectId = (option: AddTabOptions): number | undefined => {
  let objectId: number | undefined = undefined
  switch (option.type) {
    case 'note':
      objectId = option.noteId
      break
    case 'pdf':
      objectId = option.pdfId
      break
    case 'whiteboard':
      objectId = option.whiteboardId
      break
    case 'webpage':
      objectId = option.webpageId
      break
    case 'image':
      objectId = option.imageId
      break
  }
  return objectId
}

export const tabCallback = (option: AddTabOptions, tab: LayoutTab) => {
  switch (option.type) {
    case 'note': {
      const editor = (tab as LayoutTab & { type: 'note' }).editor
      editor && option.onEditorInitalized(editor)
      break
    }
    case 'pdf': {
      const viewer = (tab as LayoutTab & { type: 'pdf' }).viewer
      viewer && option.onViewerInitialized(viewer)
      break
    }
    case 'webpage': {
      const instance = (tab as LayoutTab & { type: 'webpage' }).instance
      instance && option.onWebpageInitialized?.(instance)
      break
    }
  }
}

export const normalizeAddTabOptionToLayoutTab = (option: AddTabOptions): LayoutTab => {
  let tab: LayoutTab | undefined = undefined
  switch (option.type) {
    case 'note': {
      tab = {
        type: 'note',
        objectId: option.noteId
      }
      const originFunction = option.onEditorInitalized
      option.onEditorInitalized = editor => {
        ;(tab as LayoutTab & { type: 'note' }).editor = editor
        originFunction(editor)
      }
      break
    }
    case 'pdf': {
      tab = {
        type: 'pdf',
        objectId: option.pdfId
      }
      const originFunction = option.onViewerInitialized
      option.onViewerInitialized = v => {
        ;(tab as LayoutTab & { type: 'pdf' }).viewer = v
        originFunction(v)
      }
      break
    }
    case 'home':
      tab = {
        type: 'home'
      }
      break
    case 'database':
      tab = {
        type: 'database'
      }
      break
    case 'whiteboard':
      tab = {
        type: 'whiteboard',
        objectId: option.whiteboardId
      }
      break
    case 'webpage': {
      tab = {
        type: 'webpage',
        objectId: option.webpageId
      }
      const originFunction = option.onWebpageInitialized
      const originChangeFunction = option.onWebpageChange
      option.onWebpageInitialized = i => {
        ;(tab as LayoutTab & { type: 'webpage' }).instance = i
        originFunction?.(i)
      }
      option.onWebpageChange = details => {
        ;(tab as LayoutTab & { type: 'webpage' }).objectId = details.webpageId
        originChangeFunction?.(details)
      }
      break
    }
    case 'image': {
      tab = {
        type: 'image',
        objectId: option.imageId
      }
      break
    }
  }
  return tab
}
