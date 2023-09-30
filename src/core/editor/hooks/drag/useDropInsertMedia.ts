import { saveFileLocally } from '@/utils'

const useDropInsertMedia = () => {
  const dropHandler = async (e: DragEvent) => {
    const files = e.dataTransfer?.files
    if (files?.length) {
      const firstFile = files[0]
      if (firstFile.type.startsWith('image')) {
        const res = await saveFileLocally(firstFile.path, firstFile.name)
        const filepath = res.data
        if (filepath) {
          return {
            path: filepath,
            type: 'image'
          }
        }
      }
    }
  }
  return dropHandler
}

export default useDropInsertMedia
