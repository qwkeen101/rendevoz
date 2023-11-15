import { initializePdfDocument } from '@/api/stores/document.store'
import { ObjectStore } from '@/api/stores'

const importpdf = async (file: File) => {
  const doc = await initializePdfDocument(file)
  if (doc) {
    const res = await ObjectStore('pdf').addOneWithMeta(
      { ...doc },
      { currentMeta: { name: doc.name, coverImgSrc: doc.metadata?.coverUrl }, silent: true }
    )
    return res.meta
  }
}
export default importpdf
