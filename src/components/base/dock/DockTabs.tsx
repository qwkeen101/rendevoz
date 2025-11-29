import React, { memo, useContext, useEffect, useRef, useState } from 'react'
import { DockContextType, PanelData, TabData } from './DockData'
import * as DragManager from './dragdrop/DragManager'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DockTabBar } from './DockTabBar'
import { DockTabPane, DockTabPaneContext } from './DockTabPane'
import { Tabs } from '../tabs'
import Icon from '@/components/base/Icon'
import { LayoutIdToTabMap } from '@/components/layout'
import { addDockDragHandler, DragState, removeDockDragHandler } from './dragdrop/DragManager'
import ContextMenu from '@/components/contextMenu'
import classnames from 'classnames'
import { Colors, Icons } from '@/consts'
import './dock-tab.less'
import { Menu, WithBorder } from '@/components'
import trans from '@/consts/trans'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { pointInBox } from '@/utils'
import { atom } from 'jotai/index'
import { useSetAtom } from 'jotai'

export const ShowInPanelDragEdgeAtom = atom(false)
export const IsDraggingTabAtom = atom(false)
export const TabItem = ({ data, isActive }: { data: TabData; isActive: boolean }) => {
  const context = useContext(DockContextType)
  const setGlobalDraggingTab = useSetAtom(IsDraggingTabAtom)
  const [isDragging, setIsDragging] = useState(false)
  const setShowDragEdge = useSetAtom(ShowInPanelDragEdgeAtom)
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const clonedRef = useRef<HTMLDivElement>()
  const onCloseClick = (e: React.MouseEvent) => {
    context.dockMove(data, null, 'remove')
    LayoutIdToTabMap.delete(data.id!)
    e.stopPropagation()
  }

  // if out of tabs container, clone element
  const onDragMove = (e: DragManager.DragState) => {
    const ele = ref.current
    const tabsContainer = ele?.parentElement
    if (tabsContainer) {
      const parentBounding = tabsContainer.getBoundingClientRect()
      let cloned = clonedRef.current
      if (!cloned) {
        cloned = ele.cloneNode(true) as HTMLDivElement
        const bounding = ele.getBoundingClientRect()
        cloned.id = 'dragging-tab'
        cloned.style.opacity = '1'
        cloned.style.width = `${bounding.width}px`
        cloned.style.height = `${bounding.height}px`
        cloned.style.position = 'absolute'
        cloned.style.left = `${bounding.left}px`
        cloned.style.top = `${bounding.top}px`
        cloned.style.zIndex = '100000'
        cloned.style.pointerEvents = 'none'
        clonedRef.current = cloned
        document.body.appendChild(cloned)
      }
      // still in tabs container
      if (pointInBox({ x: e.clientX, y: e.clientY }, parentBounding, 15)) {
        cloned.style.setProperty('transform', `translateX(${e.dx}px)`)
        cloned.style.removeProperty('border-radius')
        cloned.style.removeProperty('box-shadow')
        cloned.classList.remove('cloned')
        setShowDragEdge(false)
      } else {
        cloned.style.setProperty('transform', `translateX(${e.dx}px) translateY(${e.dy}px)`)
        cloned.style.setProperty('border-radius', '8px')
        cloned.style.setProperty('box-shadow', '0 0 0 2px var(--select-color)')
        cloned.classList.add('cloned')
        setShowDragEdge(true)
      }
    }
  }
  const onDragStart = (e: DragManager.DragState) => {
    const ele = ref.current
    if (ele) {
      setGlobalDraggingTab(true)
      setIsDragging(true)
      e.setData({ tab: data }, context.getDockId())
      e.startDrag(ele, ele)
    }
  }

  let { id, title, content, icon, objectId } = data
  const meta = MetaStore.useObjectToMetaValue(objectId)
  if (typeof content === 'function') {
    content = content(data)
  }
  if (typeof icon === 'string' && (icon.startsWith('park') || icon.startsWith('custom'))) {
    icon = <Icon name={icon} />
  }
  return (
    <ContextMenu
      ref={ref}
      key={id}
      content={setV => (
        <WithBorder className={'popover-menu'}>
          <Menu.NavigationMenu
            layout={[
              {
                type: 'item',
                key: 'close',
                text: t('dock.close'),
                onSelect: () => {
                  context.dockMove(data, null, 'remove')
                  LayoutIdToTabMap.delete(id)
                  setV(false)
                }
              },
              {
                type: 'item',
                key: 'close-others',
                text: t('dock.close other tabs'),
                onSelect: () => {
                  Global.layoutOps?.closeTabs('others', id)
                  setV(false)
                }
              },
              {
                type: 'item',
                key: 'close-right',
                text: t('dock.close right side tabs'),
                onSelect: () => {
                  Global.layoutOps?.closeTabs('right', id)
                  setV(false)
                }
              },
              // @ts-ignore
              ...(meta
                ? [
                    {
                      type: 'separator'
                    },
                    {
                      type: 'item',
                      key: 'view-details',
                      icon: Icons.Info,
                      text: t(trans.Meta.ViewDetails),
                      onSelect: () => {
                        setV(false)
                        Global.metaOps.openDetails?.(meta.id)
                      }
                    },
                    {
                      type: 'item',
                      key: 'edit',
                      icon: Icons.Edit,
                      text: t(trans.Edit),
                      onSelect: () => {
                        setV(false)
                        Global.metaOps.edit?.(meta.id)
                      }
                    },
                    {
                      type: 'item',
                      icon: Icons.MoveTo,
                      key: 'move-to',
                      text: t(trans.Meta.MoveTo),
                      onSelect: () => {
                        setV(false)
                        Global.metaOps.quickAdd?.(meta.id)
                      }
                    },
                    {
                      type: 'item',
                      icon: Icons.Link,
                      key: 'copy-link',
                      text: t(trans.CopyLink),
                      onSelect: () => {
                        setV(false)
                        Global.metaOps.copyLink(meta.id)
                      }
                    },
                    {
                      type: 'item',
                      key: 'delete',
                      icon: Icons.Delete,
                      text: t(trans.Delete),
                      style: {
                        color: Colors.Common.Red
                      },
                      onSelect: () => {
                        setV(false)
                        MetaStore.deleteMetaObject(meta.id)
                      }
                    }
                  ]
                : [])
            ]}
          />
        </WithBorder>
      )}
    >
      <DragDropDiv
        onDragStartT={onDragStart}
        onDragMoveT={onDragMove}
        onDragEndT={() => {
          setGlobalDraggingTab(false)
          setIsDragging(false)
          clonedRef.current?.remove()
          setShowDragEdge(false)
          clonedRef.current = undefined
        }}
        role="tab"
        onPointerDown={e => e.button === 0 && Global.layoutOps?.makeTabActive(id)}
        style={{
          opacity: isDragging ? 0 : undefined
        }}
        className={classnames('flex gap-3 items-center z-10 dock-tab-container', isActive && 'active')}
      >
        {icon && <div style={{ flexShrink: 0, zIndex: 10 }}>{icon}</div>}
        <div className={'line-clamp-1 break-all font-size-13 z-10 flex-1 whitespace-break-spaces'}>{title}</div>
        <Icon
          strokeWidth={6}
          className={'dock-tab-close shrink-0'}
          size={11}
          onPointerDown={e => e.stopPropagation()}
          onClick={onCloseClick}
          name={Icons.Close}
        />
      </DragDropDiv>
    </ContextMenu>
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
  const renderTabBar = () => {
    const { panelData } = props
    return (
      <DockTabBar
        ref={tabBarRef}
        dragIndicator={dragIndicator}
        navs={panelData.tabs.map(i => ({
          id: i.id,
          renderContent: () => <TabItem key={i.id} data={i} isActive={i.id === activeId} />
        }))}
        panelData={panelData}
      />
    )
  }
  const onTabClick = (activeId: string) => {
    Global.layoutOps?.makeTabActive(activeId)
  }
  useEffect(() => {
    const handler = (e: DragState) => {
      const dockId = context.getDockId()
      let draggingTab: TabData = DragState.getData('tab', dockId)
      if (draggingTab) {
        // get fresh tab
        draggingTab = context.find(draggingTab.id) as TabData
      }
      const tabBar = tabBarRef.current
      if (tabBar && draggingTab) {
        const barBounding = tabBar.getBoundingClientRect()
        // dragging in current tab bar
        if (pointInBox({ x: e.clientX, y: e.clientY }, barBounding)) {
          const allTabs = tabBar.querySelectorAll('[role="tab"]')
          const draggingElement = document.getElementById('dragging-tab')
          if (!draggingElement) return
          const draggingInSamePanel = props.panelData.tabs.findIndex(i => i.id === draggingTab.id)
          const { left, right } = draggingElement.getBoundingClientRect()
          if (draggingInSamePanel >= 0) {
            const draggingIndex = draggingInSamePanel
            for (let i = 0; i < allTabs.length; i++) {
              if (i === draggingIndex) {
                continue
              }
              const current = allTabs[i]
              const bounding = current.getBoundingClientRect()
              const midX = bounding.left + bounding.width / 2
              if (left < midX) {
                if (i < draggingIndex) {
                  context.dockMove(draggingTab, props.panelData.tabs[i], 'before-tab')
                  break
                }
              }
              if (right > midX) {
                if (i > draggingIndex) {
                  context.dockMove(draggingTab, props.panelData.tabs[i], 'after-tab')
                  break
                }
              }
            }
          } else {
            for (let i = 0; i < allTabs.length; i++) {
              const current = allTabs[i]
              const bounding = current.getBoundingClientRect()
              const midX = bounding.left + bounding.width / 2
              if (left < midX) {
                setDragIndicator({ id: props.panelData.tabs[i].id, dir: 'before' })
                return
              }
            }
            const last = props.panelData.tabs.at(-1)
            if (last) {
              setDragIndicator({ id: last.id, dir: 'after' })
              return
            }
          }
        }
      }
      setDragIndicator(undefined)
    }
    addDockDragHandler(handler)
    return () => {
      removeDockDragHandler(handler)
    }
  }, [props.panelData])
  const { activeId } = props.panelData
  return (
    <Tabs container={false} activeKey={activeId} onTabClick={onTabClick} renderTabNav={renderTabBar} disableInnerPanes>
      {props.panelData.tabs.map(i => (
        <DockTabPane key={i.id} cacheId={i.id}>
          <DockTabPaneContext.Provider value={{ currentTabId: i.id }}>
            {typeof i.content === 'function' ? i.content(i) : i.content}
          </DockTabPaneContext.Provider>
        </DockTabPane>
      ))}
    </Tabs>
  )
})
