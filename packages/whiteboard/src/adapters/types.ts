import { WhiteboardDropPayload, WhiteboardExportOptions, WhiteboardPastePayload, WhiteboardSearchOptions, WhiteboardSearchResult } from '../types/whiteboard'

export type WhiteboardStorageAdapter = {
  load?: (id: number) => Promise<unknown>
  save?: (value: unknown) => Promise<void>
}

export type WhiteboardMetaAdapter = {
  getIcon?: (type: string) => string | undefined
  getName?: (metaId: number) => string | undefined
  open?: (metaId: number, mode?: 'sidePeek' | 'newTab') => void
  linkMeta?: (sourceId: number, targetId: number) => Promise<void>
  unlinkMeta?: (sourceId: number, targetId: number) => Promise<void>
  search?: (opts: WhiteboardSearchOptions) => Promise<WhiteboardSearchResult[]>
}

export type WhiteboardClipboardAdapter = {
  get?: () => Promise<WhiteboardPastePayload | undefined>
  set?: (payload: WhiteboardPastePayload) => Promise<void>
}

export type WhiteboardUIAdapter = {
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void
  confirm?: (msg: string) => Promise<boolean>
  promptFile?: (accept?: string) => Promise<File | undefined>
}

export type WhiteboardDragAndDropAdapter = {
  normalizeDropEvent?: (event: DragEvent) => Promise<WhiteboardDropPayload | undefined>
  normalizePaste?: (event: ClipboardEvent) => Promise<WhiteboardPastePayload | undefined>
}

export type WhiteboardAssetAdapter = {
  normalizeFile?: (file: File) => Promise<{ meta?: unknown; object?: unknown }>
  resolveFileUrl?: (url: string) => string
}

export type WhiteboardExportAdapter = {
  exportAsImage?: (options: WhiteboardExportOptions) => Promise<Blob | undefined>
}

export type WhiteboardSettingsAdapter = {
  get?: () => Partial<{
    defaultLineType?: string
    defaultBackgroundType?: string
    snapToObject?: boolean
    darkMode?: boolean
    edgeSnapRadius?: number
    edgeSnapPrefer?: 'auto' | 'horizontal' | 'vertical'
    edgeHandleOffset?: number
  }>
}

export type WhiteboardAdapter = {
  storage?: WhiteboardStorageAdapter
  meta?: WhiteboardMetaAdapter
  clipboard?: WhiteboardClipboardAdapter
  ui?: WhiteboardUIAdapter
  dnd?: WhiteboardDragAndDropAdapter
  assets?: WhiteboardAssetAdapter
  export?: WhiteboardExportAdapter
  settings?: WhiteboardSettingsAdapter
}
