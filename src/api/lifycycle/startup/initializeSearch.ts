import { create, insertMultiple } from '@orama/orama'
import { useDb } from '@/hooks'
import { MetaObject } from '~/typings'
const initializeIndex = async () => {
  const metaObjectDb = await create({
    schema: {
      id: 'number',
      name: 'string',
      description: 'string',
      type: 'string'
    }
  })
  const metaDb = useDb('metaObjects')
  const allMetas = (await metaDb.toArray()) as MetaObject[]
  const docs = allMetas.map(i => ({ id: i.id, name: i.name, description: i.description, type: i.type }))
  await insertMultiple(metaObjectDb, docs)
}
const importAllNotes = async () => {

}
const initializeSearch = async () => {
  const index = await fetch('rendefiles://searchindex.json')
  if (!index.ok) {
    initializeIndex()
  }
}
