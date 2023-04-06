import useDb from '@/hooks/stores/useDb'
import { ICollectionItem, INote, IPdfDocument, IWhiteboard, MetaObject } from '~/typings'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from '.'
import { collectionsAtom } from './collection.store'
import { objectIdToMetaObjectIdMapAtom } from './meta.store'

// TODO : pdfElement => pdfLabel, noteElement => noteBlock
export const normalizeOldCollections = () => {
  const allCollections = Array.from(globalStore.get(collectionsAtom).values())
  const objectIdToMeta = globalStore.get(objectIdToMetaObjectIdMapAtom)
  const getType = (type: ICollectionItem['type']): MetaObject['type'] => {
    switch (type) {
      case 'note':
        return 'note'
      case 'whiteboard':
        return 'whiteboard'
      case 'document':
        return 'pdf'
      default:
        return 'normal'
    }
  }
  allCollections.forEach(async collection => {
    const newItems = (
      await Promise.all(
        collection.items?.map(async i => {
          if (!i.id) return
          if (i.type === 'collection') return i
          if (i.type !== 'meta') {
            if (objectIdToMeta?.has(i.id)) {
              return {
                id: objectIdToMeta.get(i.id),
                type: 'meta'
              } as ICollectionItem
            } else {
              const obj = await MetaStore.addMetaObject({ type: getType(i.type), objectId: i.id }, true)
              return {
                id: obj.id,
                type: 'meta'
              }
            }
          }
          if (i.type === 'meta') {
            return i
          }
        }) || []
      )
    ).filter(i => i !== undefined) as ICollectionItem[]
    CollectionStore.updateCollection(
      {
        id: collection.id,
        items: newItems
      },
      true
    )
  })
}

// migarate all to newdb
export const normalizeOldObjectsToNewObjects = () => {
  return
  const noteDb = useDb('notes')
  const pdfDb = useDb('documents')
  const whiteboardDb = useDb('whiteboards')
  const pdfLabelsDb = useDb('labels')
  const noteBlocksDb = useDb('blocks')

  noteDb.toArray().then((data: INote[]) => {
    data.forEach(i => ObjectStore('note').addOne({ ...i }))
  })
  pdfDb.toArray().then((data: IPdfDocument[]) => {
    data.forEach(i => ObjectStore('pdf').addOne({ ...i }))
  })

  whiteboardDb.toArray().then((data: IWhiteboard[]) => {
    data.forEach(i => ObjectStore('whiteboard').addOne({ ...i }))
  })

  // pdfLabelsDb.toArray().then((data: ILabel[]) => {
  //   data.forEach(i => ObjectStore('note').addOne({ ...i }))
  // })

  // noteBlocksDb.toArray().then(data => {
  //   data.forEach(i => ObjectStore('note').addOne({ ...i }))
  // })
}
