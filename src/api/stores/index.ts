import { debounce } from 'lodash'
import { handleMetaOptionChange, metaLinksAtom, metaObjectsAtom } from './meta/meta.store'
import ObjectStore from '@/api/stores/object/object.store'
import metaGroupRuleHandler from '@/api/stores/meta/metaGroupRuleHandler'
import metaObjectChangeHandler from '@/api/stores/meta/metaObjectChangeHandler'
import metaLinkChangeHandler from '@/api/stores/meta/metaLinkChangeHandler'
import { collectionChangeHandler } from '@/api/stores/collection.store'
import { createStore } from 'jotai'

export const globalStore = createStore()
export { noteStore as NoteStore } from './note.store'
export { default as MetaStore } from './meta/meta.store'
export { collectionStore as CollectionStore } from './collection.store'
export { objectStore as ObjectStore } from './object/object.store'
export { default as GroupStore } from './group.store'
export { default as ChatStore } from './chat.store'
export { default as QuestionStore } from './question.store'
export * from '@/api/textSearch/createSearchIndex'
export * as StoreUtils from './utils.store'

export const subDataChange = () => {
  metaObjectChangeHandler()
  metaGroupRuleHandler()
  metaLinkChangeHandler()
  handleMetaOptionChange()
  collectionChangeHandler()
  globalStore.sub(ObjectStore('collection').objectMapAtom, collectionChangeHandler)
  globalStore.sub(metaObjectsAtom, debounce(metaObjectChangeHandler, 600))
  globalStore.sub(metaObjectsAtom, debounce(metaGroupRuleHandler, 2000))
  globalStore.sub(metaLinksAtom, debounce(metaLinkChangeHandler, 600))
  globalStore.sub(ObjectStore('metaPropSelectOption').objectMapAtom, handleMetaOptionChange)
}
