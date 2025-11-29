import React, { forwardRef, memo, ReactElement, ReactNode, useRef, useState } from 'react'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { BoxData, PanelData } from './DockData'
import classNames from 'classnames'
import { useGlobalAtomValue } from '@/hooks'
import ClassName from '@/styles/classNames'
import { GlobalLayoutAtom } from '@/components/layout'
import { getOS } from '@/App'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import useSidebarState from '@/components/layout/sidebar/useSidebarState'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
import TabBarSyncStatus from '@/api/sync/components/TabBarSyncStatus'
import { IsDraggingTabAtom } from '@/components/base/dock/DockTabs'
import classnames from 'classnames'
import { atom } from 'jotai/index'
import { assignProperties } from '@/utils'

interface DockTabBarProps {
  panelData: PanelData
  dragIndicator?: {
    id: string
    dir: 'before' | 'after'
  }
  navs: {
    id: string
    renderContent: () => ReactElement
  }[]
}

// 第一个panel，就是左上方
const isTopLeftPanel = (panelData: PanelData | BoxData) => {
  const parent = panelData.parent
  if (parent) {
    if (parent.children.indexOf(panelData) === 0) {
      return isTopLeftPanel(parent)
    }
    return false
  }
  // no parent, true
  return true
}

const isTopRightPanel = (data: PanelData | BoxData) => {
  const panel = data
  while (data.parent) {
    data = data.parent
  }
  const topBox = data as BoxData
  if (!topBox.children.length) return false
  const loopBox = (box: BoxData): boolean => {
    if (box.mode === 'horizontal') {
      const last = box.children.at(-1)
      if (!last) return false
      if ('mode' in last) {
        return loopBox(last)
      }
      return last === panel
    }
    if (box.mode === 'vertical') {
      const firstChild = box.children[0]
      if (!firstChild) return false
      if ('mode' in firstChild) {
        return loopBox(firstChild)
      }
      return firstChild === panel
    }
    return false
  }
  return loopBox(topBox)
}

export const DockTabBar = memo(
  forwardRef((props: DockTabBarProps, outerRef) => {
    const { navs, dragIndicator, panelData } = props
    const ref = React.useRef<HTMLDivElement>()
    const isTopRight = isTopRightPanel(panelData)
    const isTopLeft = isTopLeftPanel(panelData)
    useGlobalAtomValue(GlobalLayoutAtom)
    const [tabMoreIcons, setTabMoreIcons] = useState<
      {
        id: number
        renderer: ReactNode
      }[]
    >([])
    const isFullscreen = useIsFullscreen(true)
    const sidebarState = useSidebarState()
    const reorderRef = useRef<HTMLElement>()
    const renderDragIndicator = () => {
      if (dragIndicator) {
        const all = reorderRef.current?.querySelectorAll('[role="tab-reorder-content"]')
        const target = all?.[navs.findIndex(i => i.key === dragIndicator.id)]
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
    const isDraggingTab = useGlobalAtomValue(IsDraggingTabAtom)
    assignProperties(Global, {
      layoutOps: {
        ...Global.layoutOps,
        registerTabIcon: e => {
          if (e.type === 'add') {
            setTabMoreIcons(e.icons)
          } else {
            setTabMoreIcons([])
          }
        }
      }
    })
    return (
      <DragDropDiv
        role="tablist"
        className={classNames('dock-bar', isTopRight && os !== 'macos' && 'top-right')}
        tabIndex={-1}
        ref={ref}
        style={{
          paddingLeft: isTopLeft ? (sidebarState.leftOpen ? 0 : os === 'macos' && !isFullscreen ? 76 : 48) : 0,
          background: 'var(--tabs-bg)',
          zIndex: 102,
          marginLeft: isTopLeft && !sidebarState.leftOpen && (isFullscreen || os === 'windows') ? -48 : undefined
        }}
      >
        {isTopLeft && (
          <div
            style={{
              background: 'var(--tabs-bg)',
              height: 38,
              paddingTop: 5,
              paddingRight: 12,
              paddingLeft: 6
            }}
            className={'flex gap-1 items-center transparent-font'}
          >
            {!sidebarState.leftOpen && (
              <Icon
                style={{
                  appRegion: 'no-drag'
                }}
                onClick={() => {
                  updateSidebarState(s => {
                    s.leftOpen = !s.leftOpen
                    s.leftVisible = s.leftVisible || 'application'
                  })
                }}
                name={'custom-left-bar'}
                size={18}
                className={ClassName.flatButton(6, '4px 6px')}
              />
            )}

            {tabMoreIcons.map(i => i.renderer)}
            <TabBarSyncStatus />
          </div>
        )}
        <div
          ref={outerRef}
          className={classnames('dock-tabs', isDraggingTab && 'dragging-tab')}
          style={{
            paddingTop: 6,
            position: 'relative'
          }}
        >
          {renderDragIndicator()}
          {navs.map(i => i.renderContent())}
          <Icon
            name={'park-plus'}
            onClick={() => {
              Global.metaOps.createObjects?.(undefined, undefined, { openAfterTriggerOnce: true })
            }}
            strokeWidth={4}
            size={13}
            style={{
              opacity: isDraggingTab ? 0 : 1,
              pointerEvents: isDraggingTab ? 'none' : 'auto',
              transition: 'opacity 0.2s ease'
            }}
            className={'rounded-button transparent-font ml-2'}
          />
        </div>
      </DragDropDiv>
    )
  })
)
