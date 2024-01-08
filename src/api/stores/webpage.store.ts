import { globalStore, ObjectStore } from '@/api/stores/index'

const getWebpageByUrl = (url: string) => {
  const webpageMap = globalStore.get(ObjectStore('webpage').objectMapAtom)
  return Array.from(webpageMap.values()).find(i => i.url === url)
}

export default {
  getWebpageByUrl
}
