import React, { memo, useContext, useEffect, useRef, useState } from 'react'
import { DockContextType, PanelData, TabData } from './DockData'
import * as DragManager from './dragdrop/DragManager'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DockTabBar } from './DockTabBar'
import { DockTabPane, DockTabPaneContext } from './DockTabPane'
import { getFloatPanelSize } from './Algorithm'
import { TabNavListProps, Tabs } from '../tabs'
import styles from './index.module.less'
import Icon from '@/components/base/Icon'
import { LayoutIdToTabMap } from '@/components/layout'
import ClassName from '@/styles/classNames'
import classNames from 'classnames'
import { css } from '@emotion/css'
import { addDockDragHandler, addDragStateListener, DragState, removeDockDragHandler, removeDragStateListener } from './dragdrop/DragManager'

function findParentPanel(element: HTMLElement) {
  for (let i = 0; i < 10; ++i) {
    if (!element) {
      return null
    }
    if (element.classList.contains('dock-panel')) {
      return element
    }
    element = element.parentElement
  }
  return null
}

export const TabItem = ({ data }: { data: TabData }) => {
  const context = useContext(DockContextType)

  const _ref = useRef<HTMLDivElement>(null)
  //
  const _hitAreaRef = useRef<HTMLDivElement>()
  //
  const onCloseClick = (e: React.MouseEvent) => {
    context.dockMove(data, null, 'remove')
    LayoutIdToTabMap.delete(data.id!)
    context.getGlobal().onTabClose?.(data)
    e.stopPropagation()
  }
  //
  const onDragStart = (e: DragManager.DragState) => {
    const panel = data.parent
    const panelElement = findParentPanel(_ref.current)
    const tabGroup = context.getGroup(data.group)
    const [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup)
    e.setData({ tab: data, panelSize: [panelWidth, panelHeight] }, context.getDockId())
    e.startDrag(_ref.current.parentElement, _ref.current.parentElement)
  }

  let { id, title, onTabClick, content, parent, icon } = data
  if (typeof content === 'function') {
    content = content(data)
  }
  if (typeof icon === 'string' && (icon.startsWith('park') || icon.startsWith('custom'))) {
    icon = <Icon name={icon} />
  }
  return (
    <DragDropDiv
      getRef={n => {
        _ref.current = n
      }}
      onDragStartT={onDragStart}
      role="tab"
      aria-selected={parent.activeId === id}
      onClick={onTabClick}
      key={`${id}_tab`}
      id={`${id}_tab`}
      className={css({
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      })}
    >
      {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
      <div className={styles.title}>{title}</div>
      <div className={styles.closeButtonWrapper}>
        <Icon className={classNames(styles.closeButton, ClassName.circleButton(3))} size={12} onClick={onCloseClick} name="park-close" />
      </div>
      <div className="dock-tab-hit-area" ref={_hitAreaRef} />
    </DragDropDiv>
  )
}

interface Props {
  panelData: PanelData
}

export const DockTabs = memo((props: Props) => {
  const context = useContext(DockContextType)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const [dragIndicator, setDragIndicator] = useState<{
    id: string
    dir: 'before' | 'after'
  }>()
  const renderTabBar = (defaultTabNav: TabNavListProps) => {
    const { panelData } = props
    const { group: groupName, panelLock } = panelData
    const group = context.getGroup(groupName)
    const global = context.getGlobal()
    const { globalPanelExtra } = global
    let { panelExtra } = group

    if (panelLock) {
      if (panelLock.panelExtra) {
        panelExtra = panelLock.panelExtra
      }
    }

    let panelExtraContent: React.ReactElement | undefined = undefined
    if (panelExtra) {
      panelExtraContent = panelExtra(panelData, context)
    }
    if (globalPanelExtra) {
      panelExtraContent = globalPanelExtra(panelData, context)
    }

    return (
      <DockTabBar
        ref={tabBarRef}
        onReorder={tabs => {
          const sortedTabs = tabs.map(i => panelData.tabs.find(o => o.id === i.key))
          context.updatePanel(panelData.id, { ...panelData, tabs: sortedTabs })
        }}
        dragIndicator={dragIndicator}
        TabNavList={defaultTabNav}
        panelData={panelData}
        extraArea={panelExtraContent}
      />
    )
  }
  const onTabClick = (activeId: string) => {
    props.panelData.activeId = activeId
  }
  const currDraggingTab = useRef<TabData>()
  useEffect(() => {
    const handler = (e: DragState) => {
      const dockId = context.getDockId()
      const tab: TabData = DragState.getData('tab', dockId)
      if (tab && !props.panelData.tabs.some(i => i.id === tab.id)) {
        const parentTabBar = tabBarRef.current
        currDraggingTab.current = tab
        if (parentTabBar && parentTabBar.contains(e.event.target)) {
          const allItems = parentTabBar.querySelectorAll('[role="tab-reorder-content"]')
          let idx = 0
          for (const i of allItems) {
            const next = allItems[idx + 1]
            const bounding = i.getBoundingClientRect()
            const midX = bounding.left + bounding.width / 2
            if (e.clientX < midX) {
              setDragIndicator({ id: props.panelData.tabs[idx].id, dir: 'before' })
              return
            }
            if (e.clientX > midX) {
              if (!next) {
                setDragIndicator({ id: props.panelData.tabs[idx].id, dir: 'after' })
                return
              } else {
                const nextB = next.getBoundingClientRect()
                const nextMidX = nextB.left + nextB.width / 2
                if (e.clientX < nextMidX) {
                  setDragIndicator({ id: props.panelData.tabs[idx].id, dir: 'after' })
                  return
                } else {
                  idx += 1
                  continue
                }
              }
            }
          }
        }
      }
      setDragIndicator(undefined)
    }
    const dragStateHandler = (e: DragState) => {
      if (e === null) {
        document.querySelectorAll('.dock-box').forEach(n => n.style.removeProperty('z-index'))
        document.querySelectorAll('.dock-panel').forEach(n => n.style.removeProperty('z-index'))
        const draggingTab = currDraggingTab.current
        currDraggingTab.current = undefined
        setDragIndicator(s => {
          if (s && draggingTab) {
            const targetTab = context.find(s.id) as TabData
            context.dockMove(draggingTab, targetTab, s.dir === 'before' ? 'before-tab' : 'after-tab')
          }
          return undefined
        })
      }
    }
    addDockDragHandler(handler)
    addDragStateListener(dragStateHandler)
    return () => {
      removeDockDragHandler(handler)
      removeDragStateListener(dragStateHandler)
    }
  }, [props.panelData])
  console.log(dragIndicator)
  const { activeId } = props.panelData
  return (
    <Tabs activeKey={activeId} onTabClick={onTabClick} renderTabNav={renderTabBar} disableInnerPanes>
      {props.panelData.tabs.map(i => (
        <DockTabPane parent={i.parent} key={i.id} cacheId={i.id} cached={true} tab={<TabItem data={i} />} forceRender>
          <DockTabPaneContext.Provider value={{ currentTabId: i.id }}>
            {typeof i.content === 'function' ? i.content(i) : i.content}
          </DockTabPaneContext.Provider>
        </DockTabPane>
      ))}
    </Tabs>
  )
})
