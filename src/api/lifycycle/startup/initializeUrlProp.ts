import { useDb } from '@/hooks'

export default async () => {
  const appVersion = APP_VERSION
  if (appVersion !== '0.6.1') {
    return
  }
  if (localStorage.getItem('URL_UPDATED')) return
  const objectDb = useDb('objects')
  const legacyObjects = await objectDb.filter(i => (i.fileUrl || i.imageUrl) && !i.url).toArray()
  await objectDb.bulkPut(legacyObjects.map(i => ({ ...i, url: i.fileUrl || i.imageUrl })))
  localStorage.setItem('URL_UPDATED', 'true')
}
