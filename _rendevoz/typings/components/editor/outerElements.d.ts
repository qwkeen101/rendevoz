import { ElementWithId, EmptyText } from './baseTypes'

export interface IOuterElement extends ElementWithId {
  /**
   * Origin id represents the id which the outer element has in its original place
   * For example: The id highlight has in pdf note
   */
  originId: number
  children: EmptyText[]
}

export interface SyncedBlockElement extends IOuterElement {
  type: 'synced'
  syncVersion: number
}

export interface MetaObjectElement extends IOuterElement {
  type: 'metaObject'
}
export interface InlineMetaObjectElement extends IOuterElement {
  type: 'inline-metaObject'
}
export type OuterElement = MetaObjectElement | InlineMetaObjectElement | SyncedBlockElement
