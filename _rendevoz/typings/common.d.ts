export type XYPosition = {
  x: number
  y: number
}

export type LeftTopPosition = {
  left: number
  top: number
}

export type Position = XYPosition | LeftTopPosition

export type Box = {
  left: number
  top: number
  width: number
  height: number
}

export type XYBox = {
  x: number
  y: number
  width: number
  height: number
}

export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number | string
  height: number | string
}

export type PartialWithId<T> = Partial<T> & { id: number }

export type IFolder = {
  name: string
  size: number
  files: File[]
  folders: IFolder[]
}
export type BaiduFile = {
  category: number
  isdir: 1 | 0
  path: string
  size: number
  filename: string
  fs_id: number
  createdAt: number
  server_filename?: string
  thumbs?: {
    url1?: string
    url2?: string
    url3?: string
  }
  onCreate?: (collectionId?: number) => void
  onDirFileCreate?: (progress: number) => void
}
export type IImportable = {
  files: File[]
  folders: IFolder[]
  urls: {
    name: string
    url: string
    uploaded: boolean
  }[]
  baidu: BaiduFile[]
}

