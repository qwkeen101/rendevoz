import { MetaObject } from '~/typings'

export type IImportResult<T> = {
  object: Partial<T>
  meta: Partial<MetaObject>
}
