import { atom } from 'jotai'
import { useDb, useGlobalAtomValue } from '@/hooks'
import { globalStore } from '@/api/stores/index'
import { useEffect } from 'react'
import { GlobalSetting, Setting } from '@/core'
import { MetaFilterGroup, MetaGroup, MetaObject } from '~/typings'
import { Atom } from 'jotai/vanilla'
import { selectAtom } from 'jotai/utils'
import Workspace from '@/api/common/workspace'
import SyncAPI from '@/api/sync'

export type SidebarDatabaseCache = {
  viewMode?: 'title' | 'thumbnail'
  filter?: MetaFilterGroup
  filterVisible?: boolean
  sort?: 'create' | 'view'
  searchInput?: string
  searchVisible?: boolean
  selectedMeta?: number[]
}
export type CurrentKeyValues = {
  currentWorkspace: {
    id: number
    name: string
    createdAt: number
  }
  filePickerType: 'local' | 'web' | 'baidudisk'
  moveToShowInvisible?: boolean
  // workspace to cache
  moveToCache?: Record<
    number,
    {
      recently?: {
        type: 'whiteboard' | 'note' | 'group' | 'collection' | 'tag'
        id: number
      }[]
      whiteboard?: {
        // object id
        id: number
      }
      note?: {
        // object id
        id: number
      }
      group?: {
        // meta id
        id: number
      }
      collection?: {
        id: number
      }
    }
  >
  savedGlobalSearch?: {
    id: number
    filter?: MetaFilterGroup
    workspace: number
    search?: string
    name?: string
  }[]
  savedFilters?: {
    id: number
    workspace: number
    filter?: MetaFilterGroup
    name?: string
  }[]
  showHiddenMetasInSidebar?: boolean
  searchHistory: string[]
  // [width,height,x,y]
  groupReviewPanelSize?: number[]
  allWorkspaces: {
    id: number
    name: string
    createdAt: number
  }[]
  // id to history obj
  AIChatHistory: Record<
    number,
    {
      id: number
      // meta id
      from?: number
      chats: {
        role: 'system' | 'user' | 'assistant'
        message: string
      }[]
    }
  >
  homeDisplayMode: 'gallery' | 'table'
  homeGallery: {
    visibleLists: {
      name: string
      visible: boolean
      type?: 'collection' | 'objects' | 'sorter'
      collectionId?: number
    }[]
  }
  userSetting: Setting
  recentlyUsedIcons: string[]
  webpageShowOriginal: boolean
  rightBarItems: string[]
  leftBarItems: string[]
  recycleBinGroup?: MetaGroup
  feedCardView: 'magazine' | 'card' | 'details' | 'title'
  feedOpenMode: 'rightBar' | 'center' | 'sidePeek'
  feedReadRule: 'all' | 'unread'
  feedReadLaterIds: number[]
  feedRecentlyReadIds: number[]
  feedLastSyncTime: number
  feedModalWidth: number
  mediaRightbarWidth: number
  feedReadIds: number[]
  googleNewsSearchLang: string
  homeGalleryRows?: number
  editorSettings: {
    editMode: {
      typeface: string
      fontSize: number
      lineSpacing: number
      pageWidth: string
    }
    readerMode: {
      pageWidth: string
      typeface: string
      fontSize: number
      lineSpacing: number
    }
  }
  // string is workspace
} & Record<`${MetaObject['type']}_${string}_group`, MetaGroup> &
  Record<`tag_${number}_${string}_group`, MetaGroup> &
  Record<`collection_${number}_group`, MetaGroup> &
  Record<`prop_${number}_group`, MetaGroup> &
  Record<`all_${number}_group`, MetaGroup> &
  Record<`sidebarDatabaseCache_${number}`, SidebarDatabaseCache>

const keyvalueAtom = atom<Map<string, any>>(new Map())
// todo: use atom family?
const keyAtomCache = new Map<string, Atom<any>>()
const createKeyvalueStore = () => {
  const keyvalueDb = useDb('keypairs')
  return {
    getAll: async () => {
      const map = new Map(globalStore.get(keyvalueAtom))
      await keyvalueDb.each((obj, key) => {
        map.set(key.key, obj)
      })
      globalStore.set(keyvalueAtom, map)
    },
    updateOne: async <T extends keyof CurrentKeyValues>(key: T, value: CurrentKeyValues[T]) => {
      const map = new Map(globalStore.get(keyvalueAtom))
      const newValue = value
      map.set(key, newValue)
      globalStore.set(keyvalueAtom, map)
      await keyvalueDb.put(newValue, key)
    },
    getOne: <T extends keyof CurrentKeyValues>(key: T): CurrentKeyValues[T] | undefined => {
      return globalStore.get(keyvalueAtom).get(key)
    },
    fetchOne: async <T extends keyof CurrentKeyValues>(key: T): Promise<CurrentKeyValues[T] | undefined> => {
      return await keyvalueDb.get(key)
    },
    clearAtomData: () => {
      globalStore.set(keyvalueAtom, new Map())
    },
    deleteOne: <T extends keyof CurrentKeyValues>(key: T) => {
      return keyvalueDb.delete(key)
    },
    removeFromCache: <T extends keyof CurrentKeyValues>(key: T) => {
      const m = new Map(globalStore.get(keyvalueAtom))
      m.delete(key)
      globalStore.set(keyvalueAtom, m)
    },
    freshOne: async <T extends keyof CurrentKeyValues>(key: T) => {
      const value = await keyvalueDb.get(key)
      const map = new Map(globalStore.get(keyvalueAtom))
      const prev = map.get(key)
      map.set(key, value)
      globalStore.set(keyvalueAtom, map)
      if (key === 'currentWorkspace') {
        if (value?.id !== prev?.id) {
          Workspace.switchWorkspace(value.id)
        }
      }
      if (key === 'userSetting') {
        GlobalSetting.setSetting(value)
      }
    },
    useValue: <T extends keyof CurrentKeyValues>(key: T): CurrentKeyValues[T] | undefined => {
      if (!keyAtomCache.has(key)) {
        keyAtomCache.set(
          key,
          selectAtom(keyvalueAtom, s => s.get(key))
        )
      }
      const atom = keyAtomCache.get(key)!
      const v = useGlobalAtomValue(atom)
      useEffect(() => {
        if (!v) {
          keyvalueDb.get(key).then(one => {
            const newMap = new Map(globalStore.get(keyvalueAtom))
            newMap.set(key, one)
            globalStore.set(keyvalueAtom, newMap)
          })
        }
      }, [v])
      return v
    }
  }
}

const KeyvalueStore = createKeyvalueStore()
window.addEventListener('load', () => {
  KeyvalueStore.getAll()
})
export default KeyvalueStore
