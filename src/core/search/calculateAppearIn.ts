import { MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import calculateContains from '@/core/object/objectList/calculateContains'

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
    chat?: boolean
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
    chat: AppearIn[]
    attachment: AppearIn[]
    exam: AppearIn[]
  } = {
    group: [],
    video: [],
    pdf: [],
    whiteboard: [],
    audio: [],
    webpage: [],
    note: [],
    chat: [],
    attachment: [],
    exam: []
  }
  if (!metaIdSet.size) return related
  const groups: MetaObject[] = [],
    whiteboards: MetaObject[] = [],
    notes: MetaObject[] = [],
    audios: MetaObject[] = [],
    videos: MetaObject[] = [],
    pdfs: MetaObject[] = [],
    webpages: MetaObject[] = [],
    chats: MetaObject[] = [],
    exams: MetaObject[] = []
  Array.from(MetaStore.getMetaObjectsMap().values()).forEach(m => {
    if (m.deleted) return
    if (m.attachments?.length) {
      const attachmentContains = m.attachments.filter(i => metaIdSet.has(i.id))
      if (attachmentContains.length) {
        related.attachment.push({
          parent: m,
          children: attachmentContains.map(i => MetaStore.getCachedMetaObject(i.id)).filter(i => i) as MetaObject[]
        })
      }
    }
    switch (m.type) {
      case 'exam':
        exams.push(m)
        break
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
      case 'chat':
        chats.push(m)
        break
    }
  })

  if (groups.length && options?.group !== false) {
    await Promise.all(
      groups.map(async i => {
        const contains = await calculateContains(i)
        if (contains?.length) {
          const within = contains.filter(i => metaIdSet.has(i.id))
          if (within.length) {
            related.group.push({
              parent: i,
              children: within
            })
          }
        }
      })
    )
  }
  if (whiteboards.length && options?.whiteboard !== false) {
    await Promise.all(
      whiteboards.map(async i => {
        const contains = await calculateContains(i)
        if (contains?.length) {
          const within = contains.filter(i => metaIdSet.has(i.id))
          if (within.length) {
            related.whiteboard.push({
              parent: i,
              children: within
            })
          }
        }
      })
    )
  }
  if (chats.length && options?.chat !== false) {
    await Promise.all(
      chats.map(async i => {
        const contains = await calculateContains(i)
        if (contains?.length) {
          const within = contains.filter(i => metaIdSet.has(i.id))
          if (within.length) {
            related.chat.push({
              parent: i,
              children: within
            })
          }
        }
      })
    )
  }
  if (exams.length) {
    await Promise.all(
      exams.map(async i => {
        const contains = await calculateContains(i)
        if (contains?.length) {
          const within = contains.filter(i => metaIdSet.has(i.id))
          if (within.length) {
            related.exam.push({
              parent: i,
              children: within
            })
          }
        }
      })
    )
  }
  if (notes.length && options?.note !== false) {
    await Promise.all(
      notes.map(async i => {
        const contains = await calculateContains(i)
        if (contains?.length) {
          const within = contains.filter(i => metaIdSet.has(i.id))
          if (within.length) {
            related.note.push({
              parent: i,
              children: within
            })
          }
        }
      })
    )
  }
  const transformLabels = async (type: 'pdf' | 'webpage' | 'video' | 'audio', metas: MetaObject[]) => {
    await Promise.all(
      metas.map(async m => {
        const contains = await calculateContains(m)
        if (contains?.length) {
          const within = contains.filter(i => metaIdSet.has(i.id))
          if (within.length) {
            related[type].push({
              parent: m,
              children: within
            })
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
