import Dexie from 'dexie'
import { importDB, exportDB, importInto, peakImportFile } from 'dexie-export-import'

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

export const exportRendevozDb = async () => {
  const blob = (await exportDB(db)) as Blob
  return blob
}

export const importRendevozDb = async (blob?: Blob) => {
  if (!blob) return false
  const importMeta = await peakImportFile(blob)

  if (importMeta.formatName !== 'dexie' || importMeta.data.databaseName !== 'rendevozDb' || importMeta.data.databaseVersion !== 12) {
    return false
  }
  await importInto(db, blob, { overwriteValues: true })
  return true
}
