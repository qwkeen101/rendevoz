import { S3 } from '@aws-sdk/client-s3'
import { memo } from 'react'
import S3Sync from '@/api/fileSystem/sync/s3'
import FileSystem from '@/api/fileSystem'
import exportData from '@/api/common/exportData'
import { useSetting } from '@/core'

export default memo(() => {
  const [setting] = useSetting()
  const config = setting.sync.S3Config
  if (!config) return null
  const { ak, sk, endpoint, region, bucket } = config
  if (!ak || !sk || !endpoint || !region || !bucket) return
  const listFiles = async () => {
    const re = await S3Sync.syncFolderState('files', {
      direction: 'from remote to local',
      ak,
      sk,
      region,
      endpoint,
      bucket: bucket
    })
    console.log(re)
    if (re?.filesToUpload.length) {
      S3Sync.uploadFile(re.filesToUpload, {
        ak,
        sk,
        region,
        endpoint,
        bucket: bucket.Name!
      })
    }
    if (re?.filesToDownload.length) {
      S3Sync.downloadFile(re.filesToDownload, {
        ak,
        sk,
        region,
        endpoint,
        bucket: bucket.Name!
      })
    }
  }
  const save = async () => {
    const data = await exportData()
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    client.putObject({
      Key: 'data.json',
      Body: data,
      Bucket: bucket
    })
  }
  const uploadDB = async () => {
    S3Sync.uploadDatabase({
      ak,
      sk,
      region,
      endpoint,
      bucket: bucket
    })
  }
  return (
    <>
      <div
        onClick={() => {
          uploadDB()
        }}
      >
        upload db
      </div>
      <div
        onClick={() => {
          S3Sync.syncDatabase({
            ak,
            sk,
            region,
            endpoint,
            bucket: bucket
          })
        }}
      >
        download db
      </div>
      <div
        onClick={async () => {
          const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
          const res = await client.listBuckets({})
          if (res.Buckets?.length) {
            const bucket = res.Buckets[0]!
            const file = await FileSystem.fs.readFile('/Users/realrong/Desktop/note_1.json')
            await client.putObject({
              Key: 'files/note_17283019707846.json',
              Body: file,
              Bucket: bucket.Name
            })
          }
        }}
      >
        upload
      </div>
    </>
  )
})
