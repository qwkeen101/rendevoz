import { db } from '@/utils/db'

export default (table: string) => {
  return db.table(table)
}
