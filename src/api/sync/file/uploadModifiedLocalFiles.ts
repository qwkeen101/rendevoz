import listNeedUpload from '@/api/sync/file/listNeedUpload'
import SyncAPI from '@/api/sync'

export default async (lastUploaded?: number) => {
  const client = SyncAPI.cloudClient()
  if (client) {
    const needUploadFiles = await listNeedUpload('files', lastUploaded)
    const needUploadImgs = await listNeedUpload('imgs', lastUploaded)
    if (needUploadFiles.length) {
      await client.uploadFile(needUploadFiles.map(i => `files/${i.name}`))
    }
    if (needUploadImgs.length) {
      await client.uploadFile(needUploadImgs.map(i => `imgs/${i.name}`))
    }
    const changedFiles: string[] = []
    needUploadFiles.forEach(n => changedFiles.push(`files/${n.name}`))
    needUploadImgs.forEach(n => changedFiles.push(`imgs/${n.name}`))
    return changedFiles
  }
}
