import { transformMarkdown } from '@/core/components/editor/plugins/deserializeMarkdown'
import { INote } from '~/typings'
import { NoteStore } from '@/api/stores'
import { getFilenameWithoutExtension } from '@/utils'
import { IImportResult } from '~/typings/rendevoz'

const importMarkdown = async (file: File): Promise<IImportResult<INote>> => {
  const result = await transformMarkdown(file)
  if (result) {
    const contentId = await NoteStore.saveNoteAsBuffer(result)
    const truncatedName = getFilenameWithoutExtension(file.name)
    return {
      object: {
        contentId
      },
      meta: {
        name: truncatedName,
        type: 'note'
      }
    }
  }
  throw 'Failed to parse markdown!'
}

export default importMarkdown
