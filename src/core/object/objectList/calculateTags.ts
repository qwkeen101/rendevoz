import { MetaStore, ObjectStore } from '@/api/stores'
import { ITag, MetaObject } from '~/typings'

export default async (metas: number[]) => {
  const objects = metas.map(i => MetaStore.getCachedMetaObject(i)).filter(i => i) as MetaObject[]
  const record: Record<number, number[]> = {}
  objects.forEach(i => {
    i.tags?.forEach(t => {
      const arr = record[t] ?? []
      arr.push(i.id)
      record[t] = arr
    })
  })
  const tags = await ObjectStore('tag').getMultipleByIds(Object.keys(record).map(Number))
  return new Map(tags.map(i => [i, record[i.id]])) as Map<ITag, number[]>
}
