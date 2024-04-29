import { Patch } from 'immer'
import { useDb } from '@/hooks'
const iterate = (obj: any) => {
  const stack = [obj]
  while (stack?.length > 0) {
    const currentObj = stack.pop()
    Object.keys(currentObj).forEach(key => {
      if (currentObj[key] instanceof Map) {
        currentObj[key] = Array.from(currentObj[key].values())
      }
      if (currentObj[key] instanceof Set) {
        currentObj[key] = Array.from(currentObj[key].values())
      }
      if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
        stack.push(currentObj[key])
      }
    })
  }
}
export const immerWithDatabase = (patches: Patch[], databaseName: string) => {
  const putActions: any[] = []
  const removeActions: number[] = []
  patches.forEach(i => {
    if (i.op === 'add' || i.op === 'replace') {
      const v = { ...i.value }
      iterate(v)
      putActions.push(v)
    } else {
      removeActions.push(i.path[0])
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
