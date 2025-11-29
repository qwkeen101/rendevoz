import mammoth from 'mammoth'
import deserializeHTML from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import { NoteStore } from '@/api/stores'
import { getFilenameWithoutExtension } from '@/utils'
export default async (file: File) => {
  const result = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer()
  })
  const text = result.value
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const converted = deserializeHTML(doc.body)
  if (converted) {
    const contentId = await NoteStore.saveNoteAsBuffer(converted)
    const truncatedName = getFilenameWithoutExtension(file.name)
    return {
      object: {
        contentId,
        specType: 'note'
      },
      meta: {
        name: truncatedName,
        type: 'note'
      }
    }
  } else {
    throw ''
  }
}
