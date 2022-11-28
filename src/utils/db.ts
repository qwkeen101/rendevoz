import Dexie from 'dexie'

export const db = new Dexie('rendevozDb')
db.version(9).stores({
  textselection: 'id,documentId',
  documents: 'id',
  notes: 'id',
  blocks: 'id,noteId',
  collections: 'id,parentId',
  blobs: 'id',
  labels: 'id,documentId',
  metaObjects: 'id,keyword',
  metaLinks: 'id,keyword',
  metaComments: 'id'
})
