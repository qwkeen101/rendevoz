import Dexie from 'dexie'
import { exportDB, importInto, peakImportFile } from 'dexie-export-import'

export const db = new Dexie('rendevozDb')
db.version(13).stores({
  textselection: 'id,documentId',
  documents: 'id',
  notes: 'id',
  blocks: 'id,noteId',
  collections: 'id,parentId',
  blobs: 'id',
  labels: 'id,documentId',
  metaObjects: 'id,keyword',
  metaLinks: 'id,keyword',
  metaComments: 'id',
  tags: 'id',
  whiteboards: 'id',
  objects: 'id,specType'
})
db.version(14).stores({
  textselection: null,
  documents: null,
  notes: null,
  blocks: null,
  collections: 'id,parentId',
  blobs: 'id',
  labels: null,
  metaObjects: 'id,keyword',
  metaLinks: 'id,keyword',
  metaComments: null,
  tags: null,
  whiteboards: null,
  objects: 'id,specType'
})
db.version(15).stores({
  textselection: null,
  documents: null,
  notes: null,
  blocks: null,
  collections: 'id,parentId',
  blobs: 'id',
  labels: null,
  metaObjects: 'id,keyword',
  metaLinks: 'id,keyword',
  metaComments: null,
  tags: null,
  whiteboards: null,
  objects: 'id,specType'
})
export const exportRendevozDb = async () => {
  const blob = (await exportDB(db)) as Blob
  return blob
}

export const importRendevozDb = async (blob?: Blob) => {
  if (!blob) return false
  const importMeta = await peakImportFile(blob)

  if (importMeta.formatName !== 'dexie' || importMeta.data.databaseName !== 'rendevozDb' || importMeta.data.databaseVersion !== 15) {
    return false
  }
  await importInto(db, blob, { overwriteValues: true, clearTablesBeforeImport: true })
  return true
}
