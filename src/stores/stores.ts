import { createStore } from 'jotai/vanilla'

export const globalStore = createStore()

export const findChangedProperties = (prev: object, curr: object) => {
  if (typeof prev !== 'object' || typeof curr !== 'object') return
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
    if (changedProps.has(prop)) return
    if (prev[prop] !== curr[prop]) {
      changedProps.set(prop, {
        prevProp: prev[prop] || 'undefined',
        currProp: curr[prop] || 'undefined'
      })
    }
  }
  return Array.from(changedProps.entries()).map(([k, v]) => ({ ...v, propName: k }))
}
