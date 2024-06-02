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
  if (!client) return
  const protectLocal = opt?.protectLocal ?? true
  const direction = opt?.direction ?? 'from remote to local'
  const remoteFiles = await client.listFolder(dirName)
  const remoteFileMap = new Map(remoteFiles.map(i => [i.key, i]))
  const localFiles = await FileSystem.fs.readdir(dirName)
  const localFileMap = new Map(localFiles.files.map(i => [dirName + '/' + i.name, i]))
  const filesToDelete: string[] = []
  const filesToDownload: string[] = []
  const filesToUpload: string[] = []
  const downloadState = {
    size: 0,
    count: 0
  }
  const uploadState = {
    size: 0,
    count: 0
  }
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
          downloadState.count += 1
          if (file.size) {
            downloadState.size += file.size
          }
        }
      } else {
        if (file.lastModified && file.size) {
          if (file.size !== local.size && file.lastModified > local.mtime) {
            filesToDownload.push(name)
            downloadState.size += file.size
            downloadState.count += 1
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
          uploadState.count += 1
          uploadState.size += file.size
          filesToUpload.push(name)
        }
      } else {
        if (remote.size && remote.lastModified) {
          if (remote.size !== file.size && file.mtime > remote.lastModified) {
            filesToUpload.push(name)
            uploadState.size += file.size
            uploadState.count += 1
          }
        }
      }
    })
  )
  return {
    filesToUpload,
    filesToDownload,
    filesToDelete,
    uploadState,
    downloadState
  }
}
