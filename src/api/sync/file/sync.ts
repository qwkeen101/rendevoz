import S3Sync from '@/api/sync/methods/s3'

// default s3
export default async () => {
  const setting = S3Sync.getClientFromSetting()
  if (setting) {
    await S3Sync.syncFolder('imgs', setting)
    await S3Sync.syncFolder('files', setting)
  }
}
