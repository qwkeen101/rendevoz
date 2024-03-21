import React from 'react'
import SidebarIcons from './SidebarIcons'
import { atom } from 'jotai'
import { Content, Icon } from '@/components'
import SidebarPanel from '@/components/layout/sidebar/SidebarPanel'
import { KeyToRegisteredSidebarElement } from '@/core/plugin/RegisterMap'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { RegisteredSidebarItem } from '~/typings/registered'
import { Rendevoz } from '@/core/rendevoz'
import { t } from 'i18next'
import { globalStore } from '@/api/stores'
import { GlobalScreenshotInstance } from '@/core/global/globalScreenShot'
import SidebarSetting from '@/components/layout/sidebar/SidebarSetting'
import produce, { Draft } from 'immer'
import { GlobalInstance, useSelectGlobalAtomValue } from '@/hooks'

export const setPanelState = (updater: (panelState: Draft<SidebarPanelState>) => void) => {
  const panelState = globalStore.get(SidebarPanelStateAtom)
  const newState = produce(panelState, draft => {
    updater(draft)
  })
  globalStore.set(SidebarPanelStateAtom, newState)
}
export const BuiltInSidebarItems: Record<string, RegisteredSidebarItem> = {
  home: {
    key: 'home',
    icon: 'park-home',
    onClick: () => {
      Rendevoz.Actions.Open.openHome()
    },
    text: () => t('general.home')
  },
  // collections: {
  //   key: 'collections',
  //   icon: 'park-folder-close',
  //   onClick: () => {
  //     setPanelState(s => {
  //       s.visible.has('collections') ? s.visible.delete('collections') : s.visible.add('collections')
  //     })
  //   },
  //   text: () => t('general.collection')
  // },
  screenshot: {
    key: 'screenshot',
    icon: 'park-screenshot-one',
    onClick: () => {
      GlobalScreenshotInstance.open?.()
    },
    text: () => t('general.screenshot')
  },
  search: {
    key: 'search',
    icon: 'park-search',
    onClick: () => {
      GlobalInstance.searchOps?.openSearchPanel()
    },
    text: () => t('general.search')
  },
  recycleBin: {
    key: 'recycleBin',
    icon: 'park-recycling',
    text: () => t('general.Trash'),
    onClick: () => {
      Rendevoz.Actions.Open.openRecycleBin()
    }
  },
  graph: {
    key: 'graph',
    icon: 'park-share-one',
    text: () => t('general.graph'),
    onClick: () => {
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'graph' } })
    }
  },
  // database: {
  //   key: 'database',
  //   text: () => t('general.object library'),
  //   tooltip: () => t('general.drop here to add object'),
  //   element: <SidebarDatabase />,
  //   icon: 'park-data'
  // },
  settings: {
    key: 'settings',
    text: () => t('general.settings'),
    element: <SidebarSetting />,
    icon: 'park-setting-two'
  },
  feeds: {
    key: 'feeds',
    text: () => t('general.Feeds'),
    icon: 'park-broadcast',
    onClick: () => {
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'feeds' } })
    }
  }
  // webSearch: {
  //   key: 'webSearch',
  //   text: () => t('general.web search'),
  //   icon: 'park-google',
  //   onClick: () => {
  //     setPanelState(s => {
  //       s.visible.has('webSearch') ? s.visible.delete('webSearch') : s.visible.add('webSearch')
  //     })
  //   }
  // }
}

export type ISidebarPanelVisibleItems = 'database' | 'collections' | 'webSearch' | 'category'

type SidebarPanelState = {
  visible: Set<ISidebarPanelVisibleItems>
  leftOpen?: boolean
  showObjectDetails?: {
    id: number
    visible: boolean
  }
}
export const SidebarPanelStateAtom = atom<SidebarPanelState>({
  visible: new Set<ISidebarPanelVisibleItems>()
})

const defaultSidebarItems = ['home', 'database', 'collections', 'feeds', 'search', 'graph', 'settings']

export const Sidebar = ({ direction = 'right' }: { direction: 'left' | 'right' }) => {
  const builtinSidebarEles = Array.from(Object.values(BuiltInSidebarItems))
  const registeredSidebarEles = Array.from(KeyToRegisteredSidebarElement.values())
  const allItems = [...builtinSidebarEles, ...registeredSidebarEles]
  const allItemsMap = new Map(allItems.map(i => [i.key, i]))
  const key = direction === 'right' ? 'leftBarItems' : 'rightBarItems'
  const items = KeyvalueStore.useValue(key) || (direction === 'right' ? defaultSidebarItems : [])
  const usedItems = new Set([
    ...(KeyvalueStore.useValue('leftBarItems') || defaultSidebarItems),
    ...(KeyvalueStore.useValue('rightBarItems') || [])
  ])
  const leftItems = [...(items.map(key => allItemsMap.get(key)).filter(o => o) as RegisteredSidebarItem[])].concat(
    ...allItems.filter(i => !usedItems.has(i.key))
  )
  const panelOpen = useSelectGlobalAtomValue(SidebarPanelStateAtom, s => s.leftOpen)
  return (
    <Content
      flex
      style={{
        zIndex: 100,
        flexDirection: direction === 'right' ? 'row' : 'row-reverse',
        background: 'var(--tabs-bg)'
      }}
    >
      <Content flex column>
        <div
          style={{
            width: '100%',
            height: '38px',
            borderBottom: `1px solid ${panelOpen ? 'var(--box-shadow-border)' : 'transparent'}`,
            flexShrink: 0
          }}
        ></div>
        <SidebarIcons
          items={items}
          direction={direction}
          showUser={direction === 'right'}
          leftItems={leftItems}
          onChange={v => {
            KeyvalueStore.updateOne(key, v)
          }}
        ></SidebarIcons>
      </Content>

      <SidebarPanel direction={direction} />
    </Content>
  )
}
