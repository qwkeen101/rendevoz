import useDb from '@/hooks/stores/useDb'
import { ICollectionItem, INote, IPdfDocument, IWhiteboard, MetaObject } from '~/typings'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from '.'
import { collectionsAtom } from './collection.store'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom } from './meta.store'

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
  const noteDb = useDb('notes')
  const pdfDb = useDb('documents')
  const whiteboardDb = useDb('whiteboards')
  const pdfLabelsDb = useDb('labels')
  const noteBlocksDb = useDb('blocks')

  noteDb.toArray().then((data: INote[]) => {
    Promise.all(data.map(i => ObjectStore('note').addOne({ ...i }, { silent: true, overPremium: true }))).then(() => noteDb.clear())
  })
  pdfDb.toArray().then((data: IPdfDocument[]) => {
    Promise.all(data.map(i => ObjectStore('pdf').addOne({ ...i }, { silent: true, overPremium: true }))).then(() => pdfDb.clear())
  })

  whiteboardDb.toArray().then((data: IWhiteboard[]) => {
    Promise.all(data.map(i => ObjectStore('whiteboard').addOne({ ...i }, { silent: true, overPremium: true }))).then(() =>
      whiteboardDb.clear()
    )
  })

  pdfLabelsDb.toArray().then(data => {
    Promise.all(data.map(i => ObjectStore('pdfLabel').addOne({ ...i }, { silent: true, overPremium: true }))).then(() =>
      pdfLabelsDb.clear()
    )
  })

  noteBlocksDb.toArray().then(data => {
    Promise.all(data.map(i => ObjectStore('noteBlock').addOne({ ...i }, { silent: true, overPremium: true }))).then(() =>
      noteBlocksDb.clear()
    )
  })
}

export const normalizeMetaElementsToLabelAndBlocks = () => {
  Array.from(globalStore.get(metaObjectsAtom).values()).forEach(i => {
    if (i.type === 'pdfElement') {
      MetaStore.updateMetaObject(
        {
          id: i.id,
          type: 'pdfLabel'
        },
        true
      )
    }
    if (i.type === 'noteElement') {
      MetaStore.updateMetaObject(
        {
          id: i.id,
          type: 'noteBlock'
        },
        true
      )
    }
  })
}
