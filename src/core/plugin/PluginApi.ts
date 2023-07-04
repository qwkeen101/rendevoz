import { PluginApi as PluginApiType } from '~/typings'
import { Rendevoz } from '../rendevoz'
import { css } from '@emotion/css'
import { LayoutIdToTabMap } from '@/components/layout'
import { MetaStore, ObjectStore, globalStore } from '@/stores'
import { EditorTypeToElementMap } from '../editor/maps'
import createObjectStore, { TypeToRegisteredObject, storeMap } from '@/stores/object.store'
import { TypeToRegisteredMetaObject } from '@/stores/meta.store'
import i18next from 'i18next'
import { TypeToTypeName } from '../database'
import { SettingAtom, getSetting } from '..'
import {
  KeyToRegisterdSettings,
  KeyToRegisteredDropOnProcessor,
  KeyToRegisteredGlobalElements,
  KeyToRegisteredSidebarElement
} from './RegisterMap'
import { GlobalPluginManager } from '@/App'
import { userAtom } from '@/services/login.service'

export class PluginApi {
  public name: string | undefined = undefined

  registeredMaps: PluginApiType['registeredMaps'] = {
    registerdTabs: new Map(),
    registeredMetaObjects: new Map(),
    registeredObjects: new Map(),
    registerdDropOnProcessors: new Map(),
    registeredEditorElements: new Map(),
    registeredGlobalCSS: new Map(),
    registeredGlobalElements: new Map()
  }

  public keyValueStore: PluginApiType['keyValueStore'] = new Map()

  private eventMap = new Map<string, () => void>()

  register: PluginApiType['register'] = {
    registerMetaObject: (type, opts) => {
      if (!type || !opts.i18nKey || !opts.icon || !opts.onNavigate) return
      TypeToRegisteredMetaObject.set(type, { ...opts, type })
      TypeToTypeName[type] = opts.i18nKey
      this.registeredMaps.registeredMetaObjects.set(type, { ...opts, type })
    },
    registerI18N: (lng, resource) => {
      i18next.addResourceBundle(lng, 'translation', resource, true)
    },
    registerDropOnProcessor: (key, processor) => {
      KeyToRegisteredDropOnProcessor.set(key, processor)
      this.registeredMaps.registerdDropOnProcessors.set(key, processor)
    },
    registerObject: (type, opts) => {
      if (!opts?.normalizeDraggingEleToMetaObject) return
      if (opts?.store) {
        const store = opts.store(createObjectStore)
        if (store) {
          storeMap.set(type, store)
        }
      }
      TypeToRegisteredObject.set(type, {
        normalizeDraggingEleToMetaObject: opts?.normalizeDraggingEleToMetaObject,
        allowDropOnEditor: opts?.allowDropOnEditor ?? true,
        type,
        getObjectIdFromDraggingEle: opts?.getObjectIdFromDraggingEle
      })
      this.registeredMaps.registeredObjects.set(type, { ...opts, type })
    },
    registerTab: tabData => {
      Rendevoz.Actions.Layout.registerTabData(tabData)
      this.registeredMaps.registerdTabs.set(tabData.type, tabData)
    },
    registerEditorElement: ele => {
      EditorTypeToElementMap.set(ele.type, ele)
      this.registeredMaps.registeredEditorElements.set(ele.type, ele)
    },
    registerGlobalCSS: cssString => {
      const clazz = css(cssString)
      this.registeredMaps.registeredGlobalCSS.set(clazz, cssString)
      document.body.classList.add(clazz)
    },
    registerInSidebarMenu: (key, ele) => {
      KeyToRegisteredSidebarElement.set(key, ele)
    },
    registerInSettings: opts => {
      if (!this.name) return
      KeyToRegisterdSettings.set(this.name, opts)
    },
    registerGlobalElement: (key, register) => {
      KeyToRegisteredGlobalElements.set(key, register)
      this.registeredMaps.registeredGlobalElements.set(key, register)
    }
  }

  api: PluginApiType['api'] = {
    getAllTabs: () => {
      return Array.from(LayoutIdToTabMap.values())
    },
    getLayoutTabMap: () => {
      return LayoutIdToTabMap
    },
    getObjectStore: type => ObjectStore(type),
    getMetaStore: () => MetaStore,
    getSetting: () => getSetting(),
    setSetting: setting => globalStore.set(SettingAtom, setting),
    getPlugin: name => GlobalPluginManager.plugins.find(i => i.name === name),
    getAllPlugins: () => GlobalPluginManager.plugins,
    getUserDetails: () => {
      const userDetails = globalStore.get(userAtom)
      if (userDetails) {
        return {
          photoURL: userDetails.photoURL,
          username: userDetails.username,
          uid: userDetails.uid,
          email: userDetails.email,
          emailVerified: userDetails.emailVerified
        }
      }
    }
  }

  Rendevoz = Rendevoz

  describe: PluginApiType['describe'] = ({ name, settings }) => {
    this.name = name
    console.log(name)
  }

  on: PluginApiType['on'] = (type, handler) => {
    this.eventMap.set(type, handler)
  }

  emit = (type: string) => {
    this.eventMap.get(type)?.()
  }
}

export default PluginApi
