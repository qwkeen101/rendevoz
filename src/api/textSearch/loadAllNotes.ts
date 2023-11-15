import { useDb } from '@/hooks'
import { NoteStore } from '@/api/stores'
import { MetaObject } from '~/typings'

const loadAllNotes = async () => {
  const objectDb = useDb('objects')
  const metaDb = useDb('metaObjects')
  const allMetas = new Map((await metaDb.toArray()).map(i => [i.id, i])) as Map<number, MetaObject>
  const allMetaIds = new Set(allMetas.keys()) as Set<number>
  const allNotes = await objectDb.filter(o => o.specType === 'note' && allMetaIds.has(o.metaId)).toArray()
  const all = allNotes.map(async note => {
    try {
      const v = await NoteStore.getNoteValue(note.contentId)
      return {
        value: v,
        note,
        targetMeta: allMetas.get(note.metaId)
      }
    } catch (e) {}
  })
  const result = (await Promise.all(all)).filter(i => i)
  return result
}

export default loadAllNotes
