import { ILayoutTab, TabData } from './layout'
import { Element } from 'slate'
import { createObjectStore, MetaStore, ObjectFamily } from './store'
import {
  DropOn,
  IRendevoz,
  MetaLink,
  MetaObject,
  PartialWithId,
  Setting,
  CustomEditor,
  RegisteredEditorElement,
  IDraggableElement,
  RegisteredMetaObject
} from '.'
import { ReactElement } from 'react'
import { RegisteredSetting, RegisteredSidebarItem } from './registered'

type IEditorElementEvent = (
  | {
      type: 'add'
    }
  | {
      type: 'delete'
    }
  | {
      type: 'move'
    }
) & {
  element: Element
  editor: CustomEditor
}

export type PluginApi = {
  name: string | undefined
  keyValueStore: Map<string, any>

  registeredMaps: {
    registeredTabs: Map<string, any>
    registeredMetaObjects: Map<string, any>
    registeredObjects: Map<string, any>
    registeredDropOnProcessors: Map<string, any>
    registeredEditorElements: Map<string, any>
    registeredGlobalCSS: Map<string, any>
    registeredGlobalElements: Map<string, any>
  }

  register: {
    registerTab: <K extends ILayoutTab['type']>(tab: TabData[K]) => void
    registerObject: (
      type: string,
      opts?: {
        store?: (createStoreFunction: typeof createObjectStore) => ReturnType<typeof createObjectStore>
        /**
         * Default sets to true
         */
        allowDropOnEditor?: boolean
        /**
         * Necessary if you want it can be dropped on database
         */
        getObjectIdFromDraggingEle?: (draggingDetails: IDraggableElement & { type: T }) => number
        normalizeDraggingEleToMetaObject: (draggingDetails: IDraggableElement & { type: T }) => Promise<{
          normalizedMetaObject: MetaObject
          alreadyHasMeta: boolean
          shouldOpenEditMetaModal: boolean
          preLinks: PartialWithId<MetaLink>[]
        }>
      }
    ) => void
    registerI18N: (lng: 'zh-CN' | 'en-US', resource: Record<string, any>) => void
    registerDropOnProcessor: (key: string, processor: (dropOn: DropOn, sourceMetaObject: MetaObject) => Promise<MetaLink[] | void>) => void

    /**
     * Meta-object's type should be strictly same with its corresponding object!!!
     *
     * Meta-object's type should be strictly same with its corresponding object!!!
     *
     * Meta-object's type should be strictly same with its corresponding object!!!
     */
    registerMetaObject: <T extends MetaObject['type']>(type: T, opts: Omit<RegisteredMetaObject, 'type'>) => void
    registerEditorElement: (opts: RegisteredEditorElement) => void
    /**
     * Template CSS: https://github.com/Rendevoz/RendevozPublic/blob/main/colors.less
     */
    registerGlobalCSS: (css: TemplateStringsArray) => void
    registerInSidebarMenu: (key: string, registerd: RegisteredSidebarItem) => void
    registerInSettings: (opts: RegisteredSetting) => void
    /**
     * Register an element which will never unmount
     */
    registerGlobalElement: (key: string, register: () => ReactElement) => void
  }

  api: {
    getAllTabs: () => ILayoutTab[]
    getLayoutTabMap: () => Map<string, ILayoutTab>
    getObjectStore: <K extends keyof ObjectFamily>(type: K) => ReturnType<typeof createObjectStore>
    getMetaStore: () => typeof MetaStore
    getSetting: () => Setting
    setSetting: (setting: Setting) => void
    getPlugin: (name: string) => IRendevozPluginApi | undefined
    getAllPlugins: () => IRendevozPluginApi[]
    getUserDetails: () => Pick<IUser, 'email' | 'emailVerified' | 'photoURL' | 'username' | 'uid'> | undefined
  }
  Rendevoz: IRendevoz
  describe: (description: { name: string }) => void
}
