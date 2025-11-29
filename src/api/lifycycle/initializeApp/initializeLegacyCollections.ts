import { db } from '@/utils'
import { ICollection } from '~/typings'
import { ObjectStore } from '@/api/stores'

export default async () => {
  const collectionDB = db.table('collections')
  const all = (await collectionDB.toArray()) as ICollection[]
  await collectionDB.clear()
  const available = all.filter(i => !i.deleted && typeof i.parentId === 'number' && typeof i.workspace === 'number')
  await Promise.all(
    available.map(
      async c =>
        await ObjectStore('collection').addOneWithMeta(
          {
            specType: 'collection',
            name: c.name,
            workspace: c.workspace,
            items: c.items || [],
            parentId: c.parentId,
            createdAt: c.createdAt,
            viewAt: c.viewAt,
            id: c.id
          },
          {
            currentMeta: {
              name: c.name || '',
              workspace: c.workspace,
              type: 'collection',
              createdAt: c.createdAt
            }
          }
        )
    )
  )
}
