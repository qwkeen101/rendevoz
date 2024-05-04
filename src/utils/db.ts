import Dexie from 'dexie'
import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
export const db = new Dexie('rendevozDb')
export const syncDB = new Dexie('sync')
let SyncAPI: undefined | (typeof import('@/api/sync'))['default'] = undefined

syncDB.version(1).stores({
  sync: ''
})
syncDB.version(2).stores({
  sync: '',
  modify: ''
})
syncDB.version(3).stores({
  sync: '',
  modify: '',
  state: ''
})
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
db.version(16).stores({
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
  objects: 'id,specType',
  keyvalues: 'name'
})
db.version(17).stores({
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
  objects: 'id,specType',
  keypairs: '',
  keyvalues: null
})
db.version(18).stores({
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
  objects: 'id,specType',
  keypairs: '',
  keyvalues: null,
  sync: ''
})
db.version(19).stores({
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
  objects: 'id,specType',
  keypairs: '',
  keyvalues: null,
  sync: null
})
db.use({
  stack: 'dbcore',
  create: down => ({
    ...down,
    table(name) {
      const downlevelTable = down.table(name)
      return {
        ...downlevelTable,
        mutate: req => {
          if (SyncAPI) {
            SyncAPI.database.commit(req, name)
          } else {
            import('@/api/sync').then(res => {
              SyncAPI = res.default
              res.default.database.commit(req, name)
            })
          }
          return downlevelTable.mutate(req)
        }
      }
    }
  })
})
Dexie.on('storagemutated', () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('DB_LAST_UPDATE', `${Date.now()}`)
  }
})
export const exportRendevozDb = async () => {
  const blob = (await exportDB(db)) as Blob
  return blob
}

export const importRendevozDb = async (blob?: Blob) => {
  if (!blob) return false
  const importMeta = await peakImportFile(blob)
  if (importMeta.formatName !== 'dexie' || importMeta.data.databaseName !== 'rendevozDb') {
    return false
  }
  await importInto(db, blob, {
    overwriteValues: true,
    clearTablesBeforeImport: true,
    acceptMissingTables: true,
    acceptVersionDiff: true,
    acceptNameDiff: true
  })
  return true
}
