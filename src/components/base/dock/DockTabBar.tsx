import React, { forwardRef, memo, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DockContextType, PanelData, TabData } from './DockData'
import styles from './index.module.less'
import { Reorder } from 'framer-motion'
import { TabNavListProps } from '../tabs'
import classNames from 'classnames'
import AnimatePopover from '../AnimatePopover'
import { GlobalInstance, useGlobalAtomValue, useMergedRef, useToggle } from '@/hooks'
import WithBorder from '../WithBorder'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { GlobalLayoutAtom, LayoutIdToTabMap } from '@/components/layout'
import { getOS } from '@/App'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'
import { Content, Icon, Menu } from '@/components'
import { Colors } from '@/consts'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import useSidebarState from '@/components/layout/sidebar/useSidebarState'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
import SyncPanel from '@/core/setting/sync/SyncPanel'

interface DockTabBarProps {
  TabNavList: TabNavListProps
  onReorder: (tabs: any[]) => void
  panelData: PanelData
  extraArea: React.ReactNode
  dragIndicator?: {
    id: string
    dir: 'before' | 'after'
  }
}

export const DockTabBar = memo(
  forwardRef((props: DockTabBarProps, outerRef) => {
    const { TabNavList, onReorder, dragIndicator, ...restProps } = props

    const ref = React.useRef<HTMLDivElement>()
    const mergedRef = useMergedRef(ref, outerRef)
    const getRef = (div: HTMLDivElement) => {
      mergedRef(div)
    }
    const layout = useGlobalAtomValue(GlobalLayoutAtom)
    const selectedTabKey = TabNavList.defaultActiveKey
    const [isDragging, setIsDragging] = useState(false)
    const navs = TabNavList.navs
    const dragInsideRef = useRef(false)
    const currentMoveTabId = useRef<string>()
    const [isTopRight, setIsTopRight] = useState(false)
    const [isTopLeft, setIsTopLeft] = useState(false)
    const isFullscreen = useIsFullscreen(true)
    const sidebarState = useSidebarState()
    const [innerTabs, setInnerTabs] = useState<any[]>(navs)
    const reorderRef = useRef<HTMLElement>()
    useLayoutEffect(() => {
      const bar = ref.current
      const bounding = bar?.getBoundingClientRect()
      const layoutContainer = bar?.closest('.dock-layout')
      const containerBouding = layoutContainer?.getBoundingClientRect()
      if (bounding && containerBouding) {
        const { top, left } = bounding
        if (bounding.right - containerBouding.right < 10 && top - containerBouding.top < 10) {
          setIsTopRight(true)
        } else {
          setIsTopRight(false)
        }
        if (top - containerBouding.top < 10 && left - containerBouding.left < 10) {
          setIsTopLeft(true)
        } else {
          setIsTopLeft(false)
        }
      }
    }, [layout.dockbox])
    useLayoutEffect(() => {
      setInnerTabs(navs)
    }, [navs])
    const renderDragIndicator = () => {
      if (dragIndicator) {
        const all = reorderRef.current?.querySelectorAll('[role="tab-reorder-content"]')
        const target = all?.[innerTabs.findIndex(i => i.key === dragIndicator.id)]
        if (target) {
          let t = 0
          const reorderLeft = reorderRef.current!.getBoundingClientRect().left!
          const targetLeft = target.getBoundingClientRect().left!
          const delta = targetLeft - reorderLeft
          if (dragIndicator.dir === 'before') {
            t = delta
          } else {
            t = delta + target.getBoundingClientRect().width
          }
          return (
            <div
              style={{
                position: 'absolute',
                zIndex: 10000,
                width: 5,
                transform: `translateX(${t}px)`,
                background: Colors.Common.SelectColor,
                borderRadius: 999,
                top: 6,
                bottom: 0,
                left: 0
              }}
            ></div>
          )
        }
      }
    }
    const os = getOS()
    const realtimeRef = useRef()
    return (
      <DragDropDiv
        role="tablist"
        className={classNames('dock-bar', isTopRight && os !== 'macos' && 'top-right')}
        getRef={getRef}
        tabIndex={-1}
        style={{
          paddingLeft: isTopLeft ? (sidebarState.leftOpen ? 8 : os === 'macos' && !isFullscreen ? 36 : 8) : 8,
          background: 'var(--tabs-bg)',
          zIndex: 102,
          marginLeft: isTopLeft && !sidebarState.leftOpen && (isFullscreen || os === 'windows') ? -48 : undefined
        }}
      >
        {isTopLeft && !sidebarState.leftOpen && (
          <Content
            flex
            gap={4}
            style={{
              background: 'var(--tabs-bg)',
              height: 38,
              paddingTop: 5,
              paddingRight: 12,
              fontSize: 18,
              paddingLeft: 6,
              color: Colors.Font.Transparent
            }}
            alignItems={'center'}
          >
            <SyncPanel />
            <Icon
              style={{
                '-webkit-app-region': 'no-drag'
              }}
              onClick={() => {
                updateSidebarState(s => {
                  s.leftOpen = !s.leftOpen
                  s.leftVisible = s.leftVisible || 'database'
                })
              }}
              name={'custom-left-bar'}
              className={ClassName.flatButton(4, '4px 6px')}
            />
          </Content>
        )}
        <Reorder.Group
          ref={reorderRef}
          onReorder={r => {
            realtimeRef.current = r
          }}
          className={styles.tabs}
          style={{
            background: isDragging ? 'var(--tabs-bg)' : undefined,
            paddingTop: 6,
            position: 'relative'
          }}
          axis={'x'}
          values={innerTabs}
        >
          {renderDragIndicator()}
          {innerTabs.map((i, idx) => (
            <TabItem
              item={i}
              key={i.key}
              onDrag={e => {
                if (realtimeRef.current && innerTabs !== realtimeRef.current && reorderRef.current?.contains(e.target)) {
                  setInnerTabs(realtimeRef.current)
                }
              }}
              onDragStart={() => {
                currentMoveTabId.current = i.key
                setIsDragging(true)
              }}
              onDragEnd={e => {
                console.log('end', e.target, e.currentTarget)
                dragInsideRef.current = false
                setIsDragging(false)
                if (reorderRef.current?.contains(e.target)) {
                  onReorder(innerTabs)
                }
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
)

const TabItem = ({ onClick, isSelected, item, onDragStart, isLast, onDragEnd, isDragging, onDrag }) => {
  const [contextMenuVisible, toggleContextMenuVisible] = useToggle(false)
  const { t } = useTranslation()
  const dockContext = useContext(DockContextType)
  const tabRef = useRef<HTMLDivElement>(null)
  const [currentTabMetaId, setCurrentTabMetaId] = useState<number>()
  // @ts-ignore
  const renderTabContextMenu = () => (
    <Menu.NavigationMenu
      layout={[
        {
          type: 'item',
          key: 'close',
          text: t('dock.close'),
          onSelect: () => {
            const tabData = dockContext.find(item.key) as TabData
            dockContext.dockMove(tabData, null, 'remove')
            LayoutIdToTabMap.delete(tabData.id)
            dockContext.getGlobal().onTabClose?.(tabData)
            toggleContextMenuVisible()
          }
        },
        {
          type: 'item',
          key: 'close-others',
          text: t('dock.close other tabs'),
          onSelect: () => {
            GlobalInstance.layoutOps?.closeTabs('others', item.key)
            toggleContextMenuVisible()
          }
        },
        {
          type: 'item',
          key: 'close-right',
          text: t('dock.close right side tabs'),
          onSelect: () => {
            GlobalInstance.layoutOps?.closeTabs('right', item.key)
            toggleContextMenuVisible()
          }
        },
        // @ts-ignore
        ...(currentTabMetaId
          ? [
              {
                type: 'separator'
              },
              {
                type: 'item',
                key: 'view-details',
                text: t('general.View details'),
                onSelect: () => {
                  toggleContextMenuVisible()
                  GlobalInstance.metaOps?.openDetails(currentTabMetaId)
                }
              },
              {
                type: 'item',
                key: 'edit',
                text: t('general.edit'),
                onSelect: () => {
                  toggleContextMenuVisible()
                  Rendevoz.Actions.Open.Meta.openEditMetaDialog(currentTabMetaId)
                }
              },
              {
                type: 'item',
                key: 'move-to',
                text: t('general.Move to'),
                onSelect: () => {
                  toggleContextMenuVisible()
                  GlobalInstance.metaOps?.quickAdd(currentTabMetaId)
                }
              },
              {
                type: 'item',
                key: 'delete',
                text: t('general.delete'),
                style: {
                  color: Colors.Common.Red
                },
                onSelect: () => {
                  toggleContextMenuVisible()
                  MetaStore.deleteMetaObject(currentTabMetaId)
                }
              }
            ]
          : [])
      ]}
    />
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
    <>
      <AnimatePopover
        positions={['bottom']}
        content={
          <WithBorder padding={'0.4rem 0'} width={200}>
            {renderTabContextMenu()}
          </WithBorder>
        }
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
          onDragEnd={event => {
            const p = tabRef.current?.closest('.dock-panel')
            const b = tabRef.current?.closest('.dock-box')
            if (p && b) {
              ;(p as HTMLDivElement).style.removeProperty('z-index')
              ;(b as HTMLDivElement).style.removeProperty('z-index')
            }
            onDragEnd(event)
          }}
          onDragStart={e => {
            const p = tabRef.current?.closest('.dock-panel')
            const b = tabRef.current?.closest('.dock-box')
            if (p && b) {
              ;(p as HTMLDivElement).style.zIndex = '100001'
              ;(b as HTMLDivElement).style.zIndex = '99999'
            }
            onDragStart?.(e)
          }}
          onDrag={onDrag}
          transition={{
            duration: isDragging ? 0.2 : 0
          }}
          whileDrag={{
            boxShadow: '0 0 0 2px var(--select-color)',
            borderRadius: 4,
            pointerEvents: 'none',
            overflow: 'hidden',
            opacity: 0.9
          }}
          onClick={onClick}
          value={item}
          drag={true}
          role="tab-reorder-item"
          as="div"
          id={item.key}
          className={classNames(styles.tab, isSelected && styles.active, isLast && styles.isLast)}
        >
          <div role={'tab-reorder-content'} className={classNames(styles.tabContent, isSelected && styles.active)}>
            {item.tab}
          </div>
        </Reorder.Item>
      </AnimatePopover>
      {isLastAndHasGlobalExtra && (
        <div
          style={{
            height: '100%',
            background: isSelected ? 'var(--tabs-bg)' : 'transparent'
          }}
        >
          {dockContext.getLayout().global.globalPanelExtra(null, null)}
        </div>
      )}
    </>
  )
}
