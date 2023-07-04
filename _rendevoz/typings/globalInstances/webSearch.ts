import { XYPosition } from '../common'
import { MetaObject } from '../data'

export interface IGlobalWebSearchInstance {
  open: (options: { pos?: XYPosition; e?: MouseEvent; url?: string; query?: string; from?: MetaObject['fromObject'] }) => {}
}
