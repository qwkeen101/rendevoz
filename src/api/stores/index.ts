import { debounce } from 'lodash'
import { Hooks } from 'rendevoz'
import { handleMetaOptionChange, metaLinksAtom, metaObjectsAtom } from './meta/meta.store'
import ObjectStore from '@/api/stores/object/object.store'
import metaGroupRuleHandler from '@/api/stores/meta/metaGroupRuleHandler'
import metaObjectChangeHandler from '@/api/stores/meta/metaObjectChangeHandler'
import metaLinkChangeHandler from '@/api/stores/meta/metaLinkChangeHandler'

export const globalStore = Hooks.globalStore

export const findChangedProperties = (prev: object, curr: object) => {
  if (typeof prev !== 'object' || typeof curr !== 'object') {
    return
  }
  const changedProps = new Map<string, { prevProp: any; currProp: any }>()
  for (const prop in curr) {
    if (prev[prop] !== curr[prop]) {
      changedProps.set(prop, {
        prevProp: prev[prop] || 'undefined',
        currProp: curr[prop] || 'undefined'
      })
    }
  }
  for (const prop in prev) {
    if (!changedProps.has(prop)) {
      if (prev[prop] !== curr[prop]) {
        changedProps.set(prop, {
          prevProp: prev[prop] || 'undefined',
          currProp: curr[prop] || 'undefined'
        })
      }
    }
  }
  return Array.from(changedProps.entries()).map(([k, v]) => ({
    ...v,
    propName: k
  }))
}

export { noteStore as NoteStore } from './note.store'
export { metaStore as MetaStore } from './meta/meta.store'
export { collectionStore as CollectionStore } from './collection.store'
export { objectStore as ObjectStore } from './object/object.store'
export { default as GroupStore } from './group.store'
export { default as AIStore } from './AI.store'
export { default as QuestionStore } from './question.store'
export * from '@/api/textSearch/createSearchIndex'
export * as StoreUtils from './utils.store'

export const subDataChange = () => {
  metaObjectChangeHandler()
  metaGroupRuleHandler()
  metaLinkChangeHandler()
  handleMetaOptionChange()
  globalStore.sub(metaObjectsAtom, debounce(metaObjectChangeHandler, 600))
  globalStore.sub(metaObjectsAtom, debounce(metaGroupRuleHandler, 2000))
  globalStore.sub(metaLinksAtom, debounce(metaLinkChangeHandler, 600))
  globalStore.sub(ObjectStore('metaPropSelectOption').objectMapAtom, handleMetaOptionChange)
}
