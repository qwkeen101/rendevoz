import { useDb } from '@/hooks'
import semver from 'semver'

export default async () => {
  const appVersion = APP_VERSION
  if (semver.lt(appVersion, '0.6.1')) {
    return
  }
  if (localStorage.getItem('URL_UPDATED')) return
  const objectDb = useDb('objects')
  const legacyObjects = await objectDb
    .filter(i => {
      if (i.fileUrl && !i.url) {
        return true
      }
      if (i.specType === 'image' && i.imageUrl && !i.url) {
        return true
      }
      return false
    })
    .toArray()
  await objectDb.bulkPut(legacyObjects.map(i => ({ ...i, url: i.fileUrl || i.imageUrl })))
  localStorage.setItem('URL_UPDATED', 'true')
}
