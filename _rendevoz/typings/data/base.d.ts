export type IBase = {
  id: number
  createdAt: number
  updatedAt: number
  viewAt?: number
  deleted?: boolean
  pinned?: boolean
}

export type IWebRequest<T> = {
  status: 'ERROR' | 'OK'
  message?: string
  result: T
}
