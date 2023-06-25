import { Noop } from '@/common/types'
import { Position } from '@/types'
import { Element, Path } from 'slate'
import { CustomEditor } from '~/typings'

export interface ElementFunctions {
  selectBlock: Noop
  collisionSelectBlock: Noop
  getElement: () => Element
  removeSelf: Noop
  getPath: () => Path
  getClientBound: () => DOMRect | undefined
  getIndicatorPosition: (
    direction: 'top' | 'bottom' | 'left' | 'right'
  ) => { left: number; top: number; width: number; height: number } | undefined
}
export const ID_TO_ELEMENTS_MAP = new WeakMap<CustomEditor, Map<number, ElementFunctions>>()

export const SELECTED_ID_TO_ELEMENTS_SET = new WeakMap<CustomEditor, Map<number, ElementFunctions>>()

export interface EditorSelectArea {
  startPoint: Position
  endPoint: Position
  left: number
  top: number
  right: number
  bottom: number
}
export const SELECT_AREA_MAP = new WeakMap<CustomEditor, EditorSelectArea>()

export const SELECTED_BLOCKS_MAP = new WeakMap<CustomEditor, Map<number, HTMLElement | null>>()

export const ID_TO_PATH_MAP = new WeakMap<CustomEditor, Map<number, Path>>()

export const ID_TO_FIRST_LAYER_MAP = new WeakMap<CustomEditor, Map<number, Path>>()

export const hasSelectedBlocks = (editor: CustomEditor) => {
  const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
  return selectedBlocksMap && selectedBlocksMap.size > 0
}

export interface ElementFunction {
  openMathForm?: VoidFunction
}
export const ID_TO_ELEMENT_FUNCTION_MAP = new WeakMap<CustomEditor, Map<number, ElementFunction>>()

export const EDITOR_TO_CHANGED = new WeakMap<CustomEditor, boolean>()

export const ID_TO_VISIBLE_HEADING_MAP = new WeakMap<CustomEditor, Map<number, HTMLElement>>()
