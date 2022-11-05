import { Noop } from '@/common/types'
import { CustomEditor } from './types'

export interface ElementFunctions {
  selectBlock: Noop
  changeIndicator: (direction: string | null, e?: MouseEvent) => void
}
export const ID_TO_ELEMENTS_MAP = new WeakMap<CustomEditor, Map<number, ElementFunctions>>()
