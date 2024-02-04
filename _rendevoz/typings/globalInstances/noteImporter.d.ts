import { MetaObject } from '~/typings'

export type IGlobalNoteImporterInstance = Partial<{
  import: (
    files: File[] | File,
    opts?: {
      isDir?: boolean
      dirName?: string
      onImport?: (meta: MetaObject) => void
      parentCollectionId?: number
      onEnd?: (result?: { collectionId?: number }) => void
    }
  ) => void
}>
