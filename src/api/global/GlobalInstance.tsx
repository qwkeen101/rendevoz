import { IGlobalInstance } from '~/typings'
import jumpBackToSyncBlock from '@/core/object/jumpBack/jumpBackToSyncBlock'
import globalUtils from '@/api/global/globalUtils'
import { getAppState, setAppState } from '@/api/global/states/appState'
import globalMetaOps from '@/api/global/globalMetaOps'

const eventListeners = new Map<string, Set<(args?: any) => void>>()

const GlobalInstance: IGlobalInstance = {
  values: {
    // only one can work
    registeredKeynavigationHandlers: [],
    // all work
    keydownHandlers: []
  },
  utils: { ...globalUtils },
  appState: {
    setState: setAppState,
    getState: getAppState
  },
  metaOps: globalMetaOps,
  goBackOps: {
    goBackToSyncBlock: jumpBackToSyncBlock
  },
  objectOps: {
    isLabel: o => {
      if (!o) return false
      if ('specType' in o) {
        if (['pdfLabel', 'webpageLabel', 'noteLabel', 'videoLabel', 'audioLabel'].includes(o.specType)) {
          return true
        }
      }
      return false
    }
  },
  addEventListener: (key, listener) => {
    const listeners = eventListeners.get(key) || new Set()
    listeners.add(listener)
    eventListeners.set(key, listeners)
  },
  removeEventListener: (key, listener) => {
    const listeners = eventListeners.get(key)
    listeners?.delete(listener)
  },
  emitEvent: (key, args) => {
    const listeners = eventListeners.get(key)
    listeners?.forEach(l => l(args))
  }
}

document.addEventListener('keydown', e => {
  Global.values.keydownHandlers.forEach(v => {
    v(e)
  })
  Global.values.registeredKeynavigationHandlers[0]?.(e)
})
window.Global = GlobalInstance

export default GlobalInstance
