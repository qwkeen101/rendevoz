import React from 'react'
import SidebarIcons from './SidebarIcons'
import { Content } from '@/components'
import SidebarPanel from '@/components/layout/sidebar/SidebarPanel'
import { KeyToRegisteredSidebarElement } from '@/core/plugin/RegisterMap'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { RegisteredSidebarItem } from '~/typings/registered'
import { Rendevoz } from '@/core/rendevoz'
import { t } from 'i18next'
import { GlobalScreenshotInstance } from '@/core/global/screenshot'
import SidebarSetting from '@/components/layout/sidebar/SidebarSetting'
import { GlobalInstance } from '@/hooks'
import useSidebarState from '@/components/layout/sidebar/useSidebarState'

export const BuiltInSidebarItems: Record<string, RegisteredSidebarItem> = {
  home: {
    key: 'home',
    icon: 'park-home',
    onClick: () => {
      Rendevoz.Actions.Open.openHome()
    },
    text: () => t('general.home')
  },
  database: {
    key: 'database',
    text: () => t('general.Library'),
    icon: 'custom-card-library',
    onClick: () => {
      GlobalInstance.layoutOps?.openNewTab({ type: 'database' })
    }
  },
  search: {
    key: 'search',
    icon: 'park-search',
    onClick: () => {
      GlobalInstance.searchOps?.openSearchPanel()
    },
    text: () => t('general.search')
  },
  graph: {
    key: 'graph',
    icon: 'park-share-one',
    text: () => t('general.graph'),
    onClick: () => {
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'graph' } })
    }
  },
  feeds: {
    key: 'feeds',
    text: () => t('general.Feeds'),
    icon: 'park-broadcast',
    onClick: () => {
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'feeds' } })
    }
  },
  screenshot: {
    key: 'screenshot',
    icon: 'park-screenshot-one',
    onClick: () => {
      GlobalScreenshotInstance.open?.()
    },
    text: () => t('general.screenshot')
  },
  recycleBin: {
    key: 'recycleBin',
    icon: 'park-delete',
    text: () => t('general.Trash'),
    onClick: () => {
      Rendevoz.Actions.Open.openRecycleBin()
    }
  },
  settings: {
    key: 'settings',
    text: () => t('general.settings'),
    element: <SidebarSetting />,
    icon: 'park-setting-two'
  }
}

export type ISidebarVisibleItems = 'database' | 'collections' | 'webSearch' | 'category'

export type ISidebarState = {
  leftOpen?: boolean
  leftWidth: number
  leftVisible: ISidebarVisibleItems
}

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
  const panelOpen = useSidebarState().leftOpen
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
            flexShrink: 0,
            '-webkit-app-region': 'drag'
          }}
        ></div>
        <SidebarIcons
          defaultItems={allItems}
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
