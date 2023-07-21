import { debounce } from 'lodash'
import { Hooks } from 'rendevoz'
import { handleMetaLinksChange, handleMetaObjectsChange, metaLinksAtom, metaObjectsAtom } from './meta.store'

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
export { metaStore as MetaStore } from './meta.store'
export { collectionStore as CollectionStore } from './collection.store'
export { objectStore as ObjectStore } from './object.store'

window.addEventListener('DOMContentLoaded', () => {
  globalStore.sub(metaObjectsAtom, debounce(handleMetaObjectsChange, 1000))
  globalStore.sub(metaLinksAtom, debounce(handleMetaLinksChange, 1000))
})
