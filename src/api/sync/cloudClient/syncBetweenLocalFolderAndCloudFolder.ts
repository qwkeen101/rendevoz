import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import FileSystem from '@/api/fileSystem'
import SyncAPI from '@/api/sync'

export default async (
  dirName: string,
  opt?: {
    direction?: 'from remote to local' | 'from local to remote'
    protectLocal?: boolean
  }
) => {
  const client = SyncAPI.cloudClient()
  const protectLocal = opt?.protectLocal ?? true
  const direction = opt?.direction ?? 'from remote to local'
  const remoteFiles = await client.listFolder(dirName)
  const remoteFileMap = new Map(remoteFiles.map(i => [i.key, i]))
  const localFiles = await FileSystem.fs.readdir(dirName)
  const localFileMap = new Map(localFiles.files.map(i => [dirName + '/' + i.name, i]))
  const filesToDelete: string[] = []
  const filesToDownload: string[] = []
  const filesToUpload: string[] = []
  await Promise.all(
    remoteFiles.map(async file => {
      const name = file.key
      if (name === undefined) return
      const local = localFileMap.get(name)
      if (!local) {
        if (direction === 'from local to remote') {
          filesToDelete.push(name)
        } else {
          filesToDownload.push(name)
        }
      } else {
        if (file.lastModified) {
          const mtime = file.lastModified
          if (mtime > local.mtime) {
            const uploadTime = (await SyncAPI.file.getFileSyncState(name))?.lastUpload
            if (uploadTime && Math.abs(uploadTime - mtime) < 1000) {
              return
            }
            filesToDownload.push(name)
          }
        }
      }
    })
  )
  await Promise.all(
    localFiles.files.map(async file => {
      const name = dirName + '/' + file.name
      const remote = remoteFileMap.get(name)
      if (!remote) {
        if (protectLocal === false && direction === 'from remote to local') {
          filesToDelete.push(name)
        } else {
          filesToUpload.push(name)
        }
      } else {
        if (!remote.lastModified || file.mtime > remote.lastModified) {
          const downloadTime = (await SyncAPI.file.getFileSyncState(name))?.lastDownload
          if (downloadTime && Math.abs(downloadTime - file.mtime) < 1000) {
            return
          }
          filesToUpload.push(name)
        }
      }
    })
  )
  return {
    filesToUpload,
    filesToDownload,
    filesToDelete
  }
}
