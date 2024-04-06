import { useDb } from '@/hooks'
import semver from 'semver'

export default async () => {
  if (localStorage.getItem('URL_UPDATED_V1')) return
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
  localStorage.setItem('URL_UPDATED_V1', 'true')
}
