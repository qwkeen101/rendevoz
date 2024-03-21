import { useDb } from '@/hooks'
import { NoteStore, ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'

const loadAllNotes = async () => {
  const objectDb = useDb('objects')
  const metaDb = useDb('metaObjects')
  const metaArr = await metaDb.toArray()
  const a = (
    await Promise.all(
      metaArr
        .filter(i => i.objectId)
        .map(async i => {
          const m = i as MetaObject
          if (m.type === 'webpage') {
            const webpage = await ObjectStore('webpage').getOneById(m.objectId!)
            if (webpage) {
              return [webpage.noteId, m]
            }
          }
          if (m.type === 'note') {
            return [m.objectId!, m]
          }
        })
    )
  ).filter(i => i)
  console.log(a)
  const objIdToMetaMap = new Map(a)
  const allNotes = await objectDb.filter(o => o.specType === 'note' && objIdToMetaMap.has(o.id)).toArray()
  const all = allNotes.map(async note => {
    try {
      const v = await NoteStore.getNoteValue(note.contentId)
      return {
        value: v,
        note,
        targetMeta: objIdToMetaMap.get(note.id)
      }
    } catch (e) {}
  })
  const result = (await Promise.all(all)).filter(i => i)
  return result
}

export default loadAllNotes
