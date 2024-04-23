// commit
import { IDBOperation } from '@/api/sync/db/types'
import { request } from '@/utils/request'

const remoteEndpoint = 'https://api.rendevoz.com/sync/commit'
export default (operation: Partial<IDBOperation>) => {
  const now = Date.now()
  const op: IDBOperation = {
    databaseTranscations: [],
    fileTransactions: [],
    ...operation,
    timestamp: now
  }
  request(remoteEndpoint, {
    data: op
  })
}
