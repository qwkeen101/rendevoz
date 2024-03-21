import { IWhiteboardNode, MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'

type AppearIn = {
  parent: MetaObject
  children: MetaObject[]
}
// caculate what w and g contains metas
export default async (
  currentMetas: number[],
  options?: {
    whiteboard?: boolean
    group?: boolean
    note?: boolean
  }
) => {
  const metaIdSet = new Set(currentMetas)
  const related: {
    group: AppearIn[]
    whiteboard: AppearIn[]
    note: AppearIn[]
  } = {
    group: [],
    whiteboard: [],
    note: []
  }
  if (!metaIdSet.size) return related
  const groups: MetaObject[] = [],
    whiteboards: MetaObject[] = [],
    notes: MetaObject[] = []
  Array.from(MetaStore.getMetaObjectsMap().values()).forEach(m => {
    if (m.deleted) return
    switch (m.type) {
      case 'group':
        groups.push(m)
        break
      case 'whiteboard':
        whiteboards.push(m)
        break
      case 'note':
        notes.push(m)
        break
    }
  })
  const metaMap = MetaStore.getMetaObjectsMap()
  if (groups.length && options?.group !== false) {
    await Promise.all(
      groups.map(async i => {
        const groupObj = await ObjectStore('group').fetchOneById(i.objectId!)
        if (groupObj) {
          const within = groupObj.values.filter(i => metaIdSet.has(i.id))
          console.log(metaIdSet, within, groupObj)
          if (within.length) {
            const c = Array.from(new Set(within.map(i => i.id)).values()).map(id => metaMap.get(id)!)
            related.group.push({
              parent: metaMap.get(i.id)!,
              children: c
            })
          }
        }
      })
    )
  }
  if (whiteboards.length && options?.whiteboard !== false) {
    await Promise.all(
      whiteboards.map(async i => {
        const wObj = await ObjectStore('whiteboard').fetchOneById(i.objectId!)
        console.log(wObj)
        if (wObj) {
          const withIn = (Array.from(wObj.nodes?.values() || []) as IWhiteboardNode[]).filter(
            i => i.type === 'metaObject' && metaIdSet.has(i.metaObjectId)
          )
          if (withIn.length) {
            const c = Array.from(new Set(withIn.map(i => i.metaObjectId).values())).map(i => metaMap.get(i)!)
            related.whiteboard.push({
              parent: metaMap.get(i.id)!,
              children: c
            })
          }
        }
      })
    )
  }
  if (notes.length && options?.note !== false) {
    await Promise.all(
      notes.map(async i => {
        const nObj = await ObjectStore('note').fetchOneById(i.objectId!)
        console.log(nObj)
        if (nObj && nObj.insideMetas) {
          const withIn = Object.keys(nObj.insideMetas).filter(i => metaIdSet.has(Number(i)))
          if (withIn.length) {
            const c = withIn.map(i => metaMap.get(Number(i))!)
            related.note.push({
              parent: metaMap.get(i.id)!,
              children: c
            })
          }
        }
      })
    )
  }
  return related
}
