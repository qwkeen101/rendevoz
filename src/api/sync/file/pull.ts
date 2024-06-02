import { IFileTransaction } from '@/api/sync/db/types'
import SyncAPI from '@/api/sync'
import FileSystem from '@/api/fileSystem'

export default async (transactions: IFileTransaction[]) => {
  const keys = new Set<string>(transactions.filter(i => i.type === 'put').map(i => i.name))
  if (keys.size) {
    const arr = Array.from(keys.values())
    const client = SyncAPI.cloudClient()
    if (client) {
      const needDownloadArr = new Set<string>()
      await Promise.all(
        arr.map(async path => {
          try {
            const localState = await FileSystem.fs.stat(path)
            if (!localState) {
              needDownloadArr.add(path)
              return
            }
            const remoteState = await client.statFile(path)
            if (!remoteState || !remoteState.lastModified) return
            if (localState.mtime > remoteState.lastModified) {
              return
            }
            needDownloadArr.add(path)
          } catch (e) {
            console.error(e)
          }
        })
      )
      await client.queueFiles(Array.from(needDownloadArr.values()), 'download')
    }
  }
}
