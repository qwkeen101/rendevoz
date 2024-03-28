import { atom } from 'jotai'
import { useDb, useSelectGlobalAtomValue } from '@/hooks'
import { globalStore } from '@/api/stores/index'
import { useEffect } from 'react'
import { Setting } from '@/core'
import { MetaFilterGroup, MetaGroup, MetaObject } from '~/typings'

export type CurrentKeyValues = {
  currentWorkspace: {
    id: number
    name: string
    createdAt: number
  }
  moveToShowInvisible?: boolean
  // workspace to cache
  moveToCache?: Record<
    number,
    {
      recently?: {
        type: 'whiteboard' | 'note' | 'group' | 'collection'
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
  showHiddenMetasInSidebar?: boolean
  searchHistory: string[]
  // [width,height]
  groupReviewPanelSize?: string[]
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
  Record<`prop_${number}_group`, MetaGroup>

const keyvalueAtom = atom<Map<string, any>>(new Map())

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
    deleteOne: <T extends keyof CurrentKeyValues>(key: T) => {
      return keyvalueDb.delete(key)
    },
    useValue: <T extends keyof CurrentKeyValues>(key: T): CurrentKeyValues[T] | undefined => {
      const v = useSelectGlobalAtomValue(keyvalueAtom, s => s.get(key))
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
