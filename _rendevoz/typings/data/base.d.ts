export type IBase = {
  id: number
  createdAt: number
  updatedAt: number
  viewAt?: number
  deleted?: boolean
  pinned?: boolean
  deletedAt?: number
}

export type IWebRequest<T> = {
  status: 'ERROR' | 'OK'
  message?: string
  result: T
}

export type ISidebarDefaultProps = {
  defaultActiveSidebar?:
    | 'label'
    | 'ai'
    | 'contents'
    | 'content'
    | 'info'
    | 'summary'
    | 'chapter'
    | 'playlist'
    | 'channel'
    | 'subtitles'
    | 'exam'
  defaultSidebarWidth?: number
  defaultSidebarVisible?: boolean
}
