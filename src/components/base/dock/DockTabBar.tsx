import React, { memo, useContext, useLayoutEffect, useRef, useState } from 'react'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DockContextType, PanelData, TabData } from './DockData'
import styles from './index.module.less'

import './bar.less'
import { Reorder, motion, AnimatePresence } from 'framer-motion'
import { TabNavListProps } from '../tabs'
import classNames from 'classnames'
import AnimatePopover from '../AnimatePopover'
import { useToggle } from '@/hooks'
import WithBorder from '../WithBorder'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { replacePanel } from './Algorithm'
import { LayoutIdToTabMap } from '@/components/layout'
import { useSetting } from '@/core'
import { getOS } from '@/App'
import Colors from '@/consts/colors'

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

  const navs = TabNavList.navs
  const currentMoveTabId = useRef<string>()
  const [isTopRight, setIsTopRight] = useState(false)
  const [isTopLeft, setIsTopLeft] = useState(false)
  useLayoutEffect(() => {
    const bar = ref.current
    const bounding = bar?.getBoundingClientRect()
    if (bounding) {
      const { top, right, left } = bounding
      const windowWidth = window.innerWidth
      if (Math.abs(right - windowWidth) < 10 && top < 10) {
        setIsTopRight(true)
      } else {
        setIsTopRight(false)
      }

      const globalSidebar = document.getElementById("global-sidebar")
      const sidebarWidth = globalSidebar?.getBoundingClientRect().width || 0
      if(left - sidebarWidth < 10 && top < 10){
        setIsTopLeft(true)
      }else{
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
    >
      <div style={{
        display: 'none',
        width: '80px',
        height: '100%',
        background: 'rgba(0,0,0,0.07)'
      }} id={isTopLeft && os === 'macos' ? 'macos-placeholder' : undefined}></div>
      <Reorder.Group
        onReorder={r => {
          const currIndex = r.findIndex(i => i.key === currentMoveTabId.current)
          const prevIndex = navs.findIndex(i => i.key === currentMoveTabId.current)
          const direction = currIndex > prevIndex ? 'after-tab' : 'before-tab'
          onReorder(currentMoveTabId.current, navs[currIndex].key, direction)
        }}
        className={styles.tabs}
        values={navs}
        axis="x"
      >
        <AnimatePresence initial={false}>
          {navs.map(i => (
            <TabItem
              item={i}
              key={i.key}
              onDragStart={() => {
                currentMoveTabId.current = i.key
              }}
              isSelected={selectedTabKey === i.key}
              onClick={e => {
                TabNavList.onTabClick(i.key, e)
              }}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      {restProps.extraArea}
    </DragDropDiv>
  )
})

const TabItem = memo(({ onClick, isSelected, item, onDragStart }) => {
  const [contextMenuVisible, toggleContextMenuVisible] = useToggle(false)
  const { t } = useTranslation()
  const dockContext = useContext(DockContextType)
  const [setting] = useSetting()
  const renderTabContextMenu = () => (
    <WithBorder style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
          const newPanel = { ...parentPanel, tabs: [...leftTabs], activeId: tabData.id } as PanelData
          const newLayout = replacePanel(dockContext.getLayout(), parentPanel, newPanel)
          dockContext.setLayout(newLayout)
          dockContext.onSilentChange()
          toggleContextMenuVisible()
        }}
      >
        {t('dock.close right side tabs')}
      </div>
    </WithBorder>
  )
  return (
    <AnimatePopover
      positions={['bottom']}
      content={renderTabContextMenu()}
      onClickOutside={toggleContextMenuVisible}
      padding={10}
      visible={contextMenuVisible}
    >
      <Reorder.Item
        onContextMenu={toggleContextMenuVisible}
        key={item.key}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: 0.2 },
          color: isSelected ? Colors.Font.Primary : Colors.Font.Tertiary
        }}
        onDragStart={onDragStart}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        onClick={onClick}
        value={item}
        drag={true}
        whileDrag={{ opacity: 0, transition: { duration: 0 } }}
        aria-label="tab-reorder-item"
        as="div"
        id={item.key}
        className={classNames(
          styles.tab,
          isSelected && styles.active,
          setting.background.backgroundImage && setting.background.backgroundOpacity && styles.hasBg
        )}
      >
        <motion.div layout="position" className={styles.tabContent}>
          {item.tab}
        </motion.div>
      </Reorder.Item>
    </AnimatePopover>
  )
})
