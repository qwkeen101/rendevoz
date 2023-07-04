import { TabData, ILayoutTab } from './layout'
import { Element } from 'slate'
import { CustomEditor, RegisterdEditorElement } from './editor'
import { MetaStore, ObjectFamily, createObjectStore } from './store'
import { DropOn, IRendevoz, IUser, MetaLink, MetaObject, PartialWithId, Setting } from '.'
import { IDraggableElement } from './globalInstances/dragDrop'
import { ReactElement } from 'react'
import { RegisteredSetting } from './registered'
import { IUser } from './data'

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

type IPluginEvents =
  | {
      type: 'load'
    }
  | {
      type: 'unload'
    }
  | {
      type: 'allPluginsLoaded'
    }
  | {
      type: 'appLoaded'
    }
  | {
      type: 'appInitialized'
    }

export type PluginApi = {
  name: string | undefined
  keyValueStore: Map<string, any>

  registeredMaps: {
    registerdTabs: Map<string, any>
    registeredMetaObjects: Map<string, any>
    registeredObjects: Map<string, any>
    registerdDropOnProcessors: Map<string, any>
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
    registerMetaObject: <T extends MetaObject['type']>(
      type: T,
      opts: {
        /**
         * Required for graph & other places
         */
        icon: string
        i18nKey: string
        graphSettings?: {
          /**
           * Default collision radius: 300
           */
          collisionRadius?: number
          /**
           * Default radius: 45
           */
          radius?: number
        }
        onNavigate: (metaObject: MetaObject) => void
      }
    ) => void
    registerEditorElement: (opts: RegisterdEditorElement) => void
    /**
     * Template CSS: https://github.com/Rendevoz/RendevozPublic/blob/main/colors.less
     */
    registerGlobalCSS: (css: TemplateStringsArray) => void
    registerInSidebarMenu: (
      key: string,
      element:
        | ReactElement
        | {
            icon: string
            text: string | (() => string)
            onClick: React.MouseEventHandler
          }
    ) => void
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
  on: (e: IPluginEvents['type'], handler: () => void) => void
  describe: (description: { name: string; settings: any[] }) => void
}
