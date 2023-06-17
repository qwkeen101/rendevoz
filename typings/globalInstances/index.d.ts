import { IGlobalTextSearchInstance } from './textSearch'
import { IGlobalTranslateInstance } from './translate'
import { IGlobalWebSearchInstance } from './webSearch'
import { IGlobalDragDropInstance } from './dragDrop'

declare namespace GlobalInstances {
  export type TranslateInstance = IGlobalTranslateInstance
  export type WebSearchInstance = IGlobalWebSearchInstance
  export type TextSearchInstance = IGlobalTextSearchInstance
  export type DragDropInstance = IGlobalDragDropInstance
}
