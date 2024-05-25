import { IWhiteboardNode, MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'

export type AppearIn = {
  parent: MetaObject
  children: MetaObject[]
}
export default async (
  currentMetas: number[],
  options?: {
    whiteboard?: boolean
    group?: boolean
    note?: boolean
    video?: boolean
    audio?: boolean
    pdf?: boolean
    webpage?: boolean
  }
) => {
  const metaIdSet = new Set(currentMetas)
  const related: {
    group: AppearIn[]
    whiteboard: AppearIn[]
    note: AppearIn[]
    video: AppearIn[]
    pdf: AppearIn[]
    audio: AppearIn[]
    webpage: AppearIn[]
  } = {
    group: [],
    video: [],
    pdf: [],
    whiteboard: [],
    audio: [],
    webpage: [],
    note: []
  }
  if (!metaIdSet.size) return related
  const groups: MetaObject[] = [],
    whiteboards: MetaObject[] = [],
    notes: MetaObject[] = [],
    audios: MetaObject[] = [],
    videos: MetaObject[] = [],
    pdfs: MetaObject[] = [],
    webpages: MetaObject[] = []
  Array.from(MetaStore.getMetaObjectsMap().values()).forEach(m => {
    if (m.deleted) return
    switch (m.type) {
      case 'group':
        groups.push(m)
        break
      case 'webpage':
        webpages.push(m)
        break
      case 'audio':
        audios.push(m)
        break
      case 'video':
        videos.push(m)
        break
      case 'pdf':
        pdfs.push(m)
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
        if (nObj && nObj.insideMetas) {
          const withIn = Object.keys(nObj.insideMetas)
            .filter(i => metaIdSet.has(Number(i)))
            .map(i => Number(i))
          const labels = nObj.labels
          if (labels) {
            const labelMetas = labels.map(id => MetaStore.getMetaObjectByObjectId(id)).filter(i => i) as MetaObject[]
            labelMetas
              .filter(i => metaIdSet.has(i.id))
              .forEach(m => {
                if (!withIn.includes(m.id)) {
                  withIn.push(m.id)
                }
              })
          }
          if (withIn.length) {
            const c = withIn.map(i => metaMap.get(i)!)
            related.note.push({
              parent: metaMap.get(i.id)!,
              children: c
            })
          }
        }
      })
    )
  }
  const transformLabels = async (type: 'pdf' | 'webpage' | 'video' | 'audio', metas: MetaObject[]) => {
    await Promise.all(
      metas.map(async m => {
        if (m.objectId) {
          const obj = await ObjectStore(type).fetchOneById(m.objectId)
          if (obj && obj.labels?.length) {
            const labels = obj.labels
            const labelMetas = labels.map(id => MetaStore.getMetaObjectByObjectId(id)).filter(i => i) as MetaObject[]
            const withIn = labelMetas.filter(i => metaIdSet.has(i.id))
            if (withIn.length) {
              related[type].push({
                parent: m,
                children: withIn
              })
            }
          }
        }
      })
    )
  }
  if (pdfs.length && options?.pdf !== false) {
    await transformLabels('pdf', pdfs)
  }
  if (videos.length && options?.video !== false) {
    await transformLabels('video', videos)
  }
  if (audios.length && options?.audio !== false) {
    await transformLabels('audio', audios)
  }
  if (webpages.length && options?.webpage !== false) {
    await transformLabels('webpage', webpages)
  }
  return related
}
