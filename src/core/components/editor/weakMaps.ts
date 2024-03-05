import { Noop } from '@/common/types'
import { Position } from '@/types'
import { Element, Path } from 'slate'
import { CustomEditor, ElementFunctions } from '~/typings'

export const ID_TO_ELEMENTS_MAP = new WeakMap<CustomEditor, Map<number, ElementFunctions>>()

export interface EditorSelectArea {
  startPoint: Position
  endPoint: Position
  left: number
  top: number
  right: number
  bottom: number
}
export const SELECT_AREA_MAP = new WeakMap<CustomEditor, EditorSelectArea>()

export const ID_TO_PATH_MAP = new WeakMap<CustomEditor, Map<number, Path>>()
export const ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP = new WeakMap<CustomEditor, Map<number, number>>()
export const ID_TO_FIRST_LAYER_MAP = new WeakMap<CustomEditor, Map<number, Path>>()

export interface ElementFunction {
  openMathForm?: VoidFunction
}

export const EDITOR_TO_CHANGED = new WeakMap<CustomEditor, boolean>()

export const ID_TO_VISIBLE_HEADING_MAP = new WeakMap<CustomEditor, Map<number, HTMLElement>>()
