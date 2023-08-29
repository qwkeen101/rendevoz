import { transformMarkdown } from '@/core/editor/plugins/deserializeMarkdown'
import { INote, MetaObject } from '~/typings'
import { NoteStore, ObjectStore } from '@/stores'
import { getFilenameWithoutExtension } from '@/utils'

const importmarkdown = async (file: File) => {
  const result = await transformMarkdown(file)
  let note: MetaObject | undefined = undefined
  if (result) {
    const contentId = await NoteStore.saveNoteAsBuffer(result)
    const truncatedName = getFilenameWithoutExtension(file.name)
    note = (
      await ObjectStore('note').addOneWithMeta(
        { title: truncatedName, contentId },
        {
          currentMeta: { name: truncatedName, type: 'note' },
          silent: true
        }
      )
    ).meta
  }
  return note
}

export default importmarkdown
