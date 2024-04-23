export type IDBTransaction = {
  database: string
} & (
  | {
      type: 'put'
      key?: string | number
      value: any
    }
  | {
      type: 'delete'
      key: string | number
    }
)

export type IFileTransaction = {
  name: string
} & (
  | {
      type: 'put'
    }
  | {
      type: 'delete'
    }
)
export type IDBOperation = {
  timestamp: number
  databaseTranscations: IDBTransaction[]
  fileTransactions: IFileTransaction[]
}
