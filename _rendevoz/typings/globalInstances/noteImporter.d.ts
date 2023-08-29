export type IGlobalNoteImporterInstance = Partial<{
  import: (
    files: File[] | File,
    opts?: {
      isDir?: boolean
      dirName?: string
    }
  ) => void
}>
