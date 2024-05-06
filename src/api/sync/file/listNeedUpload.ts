import FileSystem from '@/api/fileSystem'
import SyncAPI from '@/api/sync'
import { ISystemFile } from '~/typings/fs'

export default async (dirName: string, lastUploaded?: number) => {
  const client = SyncAPI.cloudClient()
  if (!client) return []
  const allFiles = await FileSystem.fs.readdir(dirName)
  const leftFiles = lastUploaded ? allFiles.files.filter(i => i.mtime > lastUploaded) : allFiles.files
  const finalFiles = (
    await Promise.all(
      leftFiles.map(async i => {
        try {
          const remote = await client.statFile(`${dirName}/${i.name}`)
          if (!remote || remote.size !== i.size) {
            return i
          }
        } catch (e) {
          return
        }
      })
    )
  ).filter(i => i)
  return finalFiles as ISystemFile[]
}
