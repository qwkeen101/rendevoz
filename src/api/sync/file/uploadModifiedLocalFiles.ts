import listNeedUpload from '@/api/sync/file/listNeedUpload'
import SyncAPI from '@/api/sync'

export default async (lastUploaded?: number) => {
  const client = SyncAPI.cloudClient()
  if (client) {
    const changedFiles: string[] = []
    const upload = async (dir: string) => {
      const needUpload = await listNeedUpload(dir, lastUploaded)
      console.log(needUpload, dir)
      if (needUpload.length) {
        await client.uploadFile(needUpload.map(i => `${dir}/${i.name}`))
        needUpload.forEach(n => {
          changedFiles.push(`${dir}/${n.name}`)
        })
      }
    }
    // await upload('test')
    await upload('files')
    await upload('imgs')
    upload('backup')
    return changedFiles
  }
}
