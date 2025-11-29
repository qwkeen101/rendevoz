import { MetaGroup } from '~/typings'

export type IGroupEvent =
  | {
      type: 'deleteRow'
      rowId: number
      metaId: number
    }
  | {
      type: 'deleteMeta'
      metaId: number
      rowId: number
    }
  | {
      type: 'clearAll'
    }
  | {
      type: 'groupDataChange'
      value: Partial<MetaGroup>
      onChange: (g: MetaGroup) => void
    }
  | {
      type: 'metaDragInside'
      ids: number[]
    }
  | {
      type: 'groupMetaChange'
      value: {
        name?: string
        description?: string
        icon?: string
      }
    }
