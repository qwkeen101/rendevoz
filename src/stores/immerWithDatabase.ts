import { Patch } from 'immer'
import { useDb } from '@/hooks'

export const immerWithDatabase = (patches: Patch[], databaseName: string) => {
  const putActions: any[] = []
  const removeActions: number[] = []
  patches.forEach(i => {
    if (i.op === 'add' || i.op === 'replace') {
      putActions.push(i.value)
    } else {
      removeActions.push(i.value.id)
    }
  })
  const db = useDb(databaseName)
  if (db) {
    if (putActions.length) {
      db.bulkPut(putActions)
    }
    if (removeActions.length) {
      db.bulkDelete(removeActions)
    }
  }
}
