import React, { memo, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DockContextType, PanelData, TabData } from './DockData'
import styles from './index.module.less'

import { Reorder } from 'framer-motion'
import { TabNavListProps } from '../tabs'
import classNames from 'classnames'
import AnimatePopover from '../AnimatePopover'
import { GlobalInstance, useGlobalAtom, useGlobalSetAtom, useToggle } from '@/hooks'
import WithBorder from '../WithBorder'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { replacePanel } from './Algorithm'
import { LayoutIdToTabMap } from '@/components/layout'
import { getOS } from '@/App'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { SidebarPanelStateAtom } from '@/components/layout/sidebar'
import produce from 'immer'
import { Colors } from '@/consts'
import { ipcInstance } from '@/plugins'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'

interface DockTabBarProps {
  TabNavList: TabNavListProps
  onReorder: (sourceId: string, destId: string, direction: 'after' | 'before') => void
  panelData: PanelData
  extraArea: React.ReactNode
}

export const DockTabBar = memo((props: DockTabBarProps) => {
  const { TabNavList, onReorder, ...restProps } = props

  const ref = React.useRef<HTMLDivElement>()
  const getRef = (div: HTMLDivElement) => {
    ref.current = div
  }
  const selectedTabKey = TabNavList.defaultActiveKey
  const [isDragging, setIsDragging] = useState(false)
  const navs = TabNavList.navs
  const dragInsideRef = useRef(false)
  const currentMoveTabId = useRef<string>()
  const [isTopRight, setIsTopRight] = useState(false)
  const [isTopLeft, setIsTopLeft] = useState(false)
  const [isTop, setIsTop] = useState(false)
  const isFullscreen = useIsFullscreen(true)
  const [panelState, setPanelState] = useGlobalAtom(SidebarPanelStateAtom)
  useLayoutEffect(() => {
    const bar = ref.current
    const bounding = bar?.getBoundingClientRect()
    const layoutContainer = bar?.closest('.dock-layout')
    const containerBouding = layoutContainer?.getBoundingClientRect()
    if (bounding && containerBouding) {
      const { top, left } = bounding
      if (top - containerBouding.top < 10) {
        setIsTop(true)
      } else {
        setIsTop(false)
      }
      if (containerBouding.right - bounding.right < 10 && top < 10) {
        setIsTopRight(true)
      } else {
        setIsTopRight(false)
      }
      if (top < 10 && left - containerBouding.left < 10) {
        setIsTopLeft(true)
      } else {
        setIsTopLeft(false)
      }
    }
  })
  const os = getOS()
  return (
    <DragDropDiv
      role="tablist"
      className={classNames('dock-bar', isTopRight && os !== 'macos' && 'top-right')}
      getRef={getRef}
      tabIndex={-1}
      style={{
        paddingLeft: isTopLeft ? (panelState.leftOpen ? 8 : os === 'macos' && !isFullscreen ? 36 : 8) : 8,
        background: 'var(--tabs-bg)',
        zIndex: 9999,
        marginLeft: isTopLeft && os === 'macos' && !panelState.leftOpen && isFullscreen ? -48 : undefined
      }}
    >
      {isTopLeft && !panelState.leftOpen && (
        <Content
          flex
          gap={4}
          style={{
            background: 'var(--tabs-bg)',
            height: 38,
            paddingTop: 5,
            paddingRight: 12,
            fontSize: 18,
            paddingLeft: os === 'macos' ? 6 : 0,
            color: Colors.Font.Transparent
          }}
          alignItems={'center'}
        >
          <Icon
            onClick={() => {
              setPanelState(s =>
                produce(s, draft => {
                  draft.leftOpen = true
                  draft.visible.size === 0 && draft.visible.add('database')
                })
              )
            }}
            name={'custom-left-bar'}
            className={ClassName.flatButton(4, '4px 6px')}
          />
        </Content>
      )}
      <Reorder.Group
        onReorder={r => {
          const currIndex = r.findIndex(i => i.key === currentMoveTabId.current)
          const prevIndex = navs.findIndex(i => i.key === currentMoveTabId.current)
          const direction = currIndex > prevIndex ? 'after-tab' : 'before-tab'
          onReorder(currentMoveTabId.current, navs[currIndex].key, direction)
        }}
        className={styles.tabs}
        style={{
          background: isDragging ? 'var(--tabs-bg)' : undefined,
          paddingTop: isTop ? 8 : 6
        }}
        axis={'x'}
        values={navs}
      >
        {navs.map((i, idx) => (
          <TabItem
            item={i}
            key={i.key}
            onDragStart={() => {
              currentMoveTabId.current = i.key
              setIsDragging(true)
            }}
            onDragEnd={() => {
              dragInsideRef.current = false
              setIsDragging(false)
            }}
            isDragging={isDragging}
            isSelected={selectedTabKey === i.key}
            onClick={e => {
              TabNavList.onTabClick(i.key, e)
            }}
            isLast={idx === navs.length - 1}
          />
        ))}
      </Reorder.Group>
    </DragDropDiv>
  )
})

const TabItem = ({ onClick, isSelected, item, onDragStart, isLast, onDragEnd, isDragging, onDrag }) => {
  const [contextMenuVisible, toggleContextMenuVisible] = useToggle(false)
  const { t } = useTranslation()
  const dockContext = useContext(DockContextType)
  const tabRef = useRef<HTMLDivElement>(null)
  const [currentTabMetaId, setCurrentTabMetaId] = useState<number>()
  const renderTabContextMenu = () => (
    <WithBorder width={170} style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        className={ClassName.flatButton()}
        onClick={e => {
          const tabData = dockContext.find(item.key) as TabData
          dockContext.dockMove(tabData, null, 'remove')
          LayoutIdToTabMap.delete(tabData.id)
          dockContext.getGlobal().onTabClose?.(tabData)
          toggleContextMenuVisible()
        }}
      >
        {t('dock.close')}
      </div>
      <div
        className={ClassName.flatButton()}
        onClick={e => {
          const tabData = dockContext.find(item.key) as TabData
          const parentPanel = tabData.parent as PanelData
          parentPanel.tabs
            .filter(i => i !== tabData)
            .map(i => i.id)
            .forEach(id => id && LayoutIdToTabMap.delete(id))
          const newPanel = { ...parentPanel, tabs: [tabData] } as PanelData
          const newLayout = replacePanel(dockContext.getLayout(), parentPanel, newPanel)
          dockContext.setLayout(newLayout)
          dockContext.onSilentChange()
          toggleContextMenuVisible()
        }}
      >
        {t('dock.close other tabs')}
      </div>
      <div
        className={ClassName.flatButton()}
        onClick={e => {
          const tabData = dockContext.find(item.key) as TabData
          const parentPanel = tabData.parent as PanelData
          const idx = parentPanel.tabs.findIndex(i => i === tabData)
          const leftTabs = parentPanel.tabs.slice(0, idx + 1)
          const rightTabs = parentPanel.tabs.slice(idx + 1, -1)
          rightTabs.forEach(tab => tab.id && LayoutIdToTabMap.delete(tab.id))
          const newPanel = {
            ...parentPanel,
            tabs: [...leftTabs],
            activeId: tabData.id
          } as PanelData
          const newLayout = replacePanel(dockContext.getLayout(), parentPanel, newPanel)
          dockContext.setLayout(newLayout)
          dockContext.onSilentChange()
          toggleContextMenuVisible()
        }}
      >
        {t('dock.close right side tabs')}
      </div>
      {currentTabMetaId && (
        <div
          className={ClassName.flatButton()}
          onClick={e => {
            toggleContextMenuVisible()
            GlobalInstance.metaOps?.openDetails(currentTabMetaId)
          }}
        >
          {t('general.View details')}
        </div>
      )}
      {currentTabMetaId && (
        <div
          className={ClassName.flatButton()}
          onClick={e => {
            toggleContextMenuVisible()
            Rendevoz.Actions.Open.Meta.openEditMetaDialog(currentTabMetaId)
          }}
        >
          {t('general.edit')}
        </div>
      )}
      {currentTabMetaId && (
        <div
          className={ClassName.flatButton()}
          onClick={e => {
            toggleContextMenuVisible()
            GlobalInstance.metaOps?.quickAdd(currentTabMetaId)
          }}
        >
          {t('general.Move to')}
        </div>
      )}
    </WithBorder>
  )
  useEffect(() => {
    if (isSelected) {
      const previous = tabRef.current?.previousElementSibling
      if (previous) {
        previous.setAttribute('data-hide-border', 'true')
        return () => {
          previous.removeAttribute('data-hide-border')
        }
      }
    }
  }, [isSelected])

  const isLastAndHasGlobalExtra = isLast && dockContext.getLayout().global.globalPanelExtra && !isDragging
  return (
    <AnimatePopover
      positions={['bottom']}
      content={renderTabContextMenu()}
      onClickOutside={toggleContextMenuVisible}
      padding={10}
      innerRef={tabRef}
      visible={contextMenuVisible}
    >
      <Reorder.Item
        onContextMenu={() => {
          toggleContextMenuVisible()
          const tab = Rendevoz.Actions.Layout.getTabById(item.key)
          if (tab) {
            const objectId = tab.objectId
            if (objectId) {
              const meta = MetaStore.getMetaObjectByObjectId(objectId)
              if (meta) {
                setCurrentTabMetaId(meta.id)
              }
            }
          }
        }}
        onDragEnd={() => {
          onDragEnd()
        }}
        onDragStart={e => {
          onDragStart?.(e)
        }}
        onDrag={onDrag}
        whileDrag={{
          boxShadow: '0 0 0 2px var(--select-color)',
          borderRadius: 4,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
        // exit={{ opacity: 0, transition: { duration: 0.3 } }}
        onClick={onClick}
        value={item}
        drag={true}
        aria-label="tab-reorder-item"
        as="div"
        id={item.key}
        className={classNames(styles.tab, isSelected && styles.active, isLast && styles.isLast)}
        style={{
          paddingRight: isLastAndHasGlobalExtra ? 30 : undefined
        }}
      >
        <div className={classNames(styles.tabContent, isSelected && styles.active)}>{item.tab}</div>
        {isLastAndHasGlobalExtra && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              background: isSelected ? 'var(--tabs-bg)' : 'transparent'
            }}
          >
            {dockContext.getLayout().global.globalPanelExtra(null, null)}
          </div>
        )}
      </Reorder.Item>
    </AnimatePopover>
  )
}
