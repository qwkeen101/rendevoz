import Icon from '@/components/base/Icon'
import styles from './index.module.less'
import { MenuItem } from './Item'
import classNames from 'classnames'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import { KeyToRegisteredSidebarElement } from '@/core/plugin/RegisterMap'
import React, { useEffect, useRef, useState } from 'react'
import { useGlobalAtom } from '@/hooks'
import { SidebarPanelStateAtom } from '@/components/layout/sidebar/index'
import { Colors } from '@/consts'
import { Reorder } from 'framer-motion'
import ContextMenu from '@/components/contextMenu'
import { Content, Tooltip, WithBorder } from '@/components'
import { BuiltInSidebarItems } from '@/components/layout/sidebar/index'
import { RegisteredSidebarItem } from '~/typings/registered'
import { ClassName } from 'rendevoz'
import SidebarUser from '@/components/layout/sidebar/SidebarUser'
import { useUpdate } from 'react-use'
import { atom } from 'jotai'

const SidebarIconDraggingAtom = atom<{
  isDragging: boolean
  draggingItem?: string
  onDropOnOtherPos?: VoidFunction
}>({
  isDragging: false
})
const SidebarIcons = ({
  items,
  onChange,
  showUser,
  direction,
  leftItems
}: {
  items: string[]
  showUser?: boolean
  leftItems: RegisteredSidebarItem[]
  onChange: (items: string[]) => void
  direction: 'left' | 'right'
}) => {
  const [panelState, setPanelState] = useGlobalAtom(SidebarPanelStateAtom)
  const selectedItem = panelState.visible
  const [sidebarIconDraggingState, setSidebarIconDraggingState] = useGlobalAtom(SidebarIconDraggingAtom)
  const renderSidebarItem = (k: string) => {
    const buildIn = BuiltInSidebarItems[k] || KeyToRegisteredSidebarElement.get(k)
    if (buildIn) {
      const rendered = buildIn.element ? (
        buildIn.element
      ) : (
        <MenuItem onClick={buildIn.onClick}>
          <Icon name={buildIn.icon || 'park-help'} size={20} />
        </MenuItem>
      )
      return (
        <Tooltip position="right" content={buildIn.tooltip ? buildIn.tooltip() : buildIn.text?.()}>
          <Content
            style={{
              background: selectedItem.has(k) ? Colors.Background.ButtonActive : undefined,
              borderRadius: 6
            }}
          >
            {rendered}
          </Content>
        </Tooltip>
      )
    }
  }
  const isDraggingRef = useRef(false)
  const update = useUpdate()
  useEffect(() => {
    const interval = setInterval(() => update(), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])
  const [dragInto, setDragInto] = useState(false)
  return (
    <>
      <ContextMenu
        content={
          <WithBorder padding={6} style={{ minWidth: 160 }}>
            {leftItems.map(i => (
              <Content
                onClick={() => {
                  items.some(o => o === i.key) ? onChange(items.filter(o => o !== i.key)) : onChange([...items, i.key])
                }}
                key={i.key}
                flex
                gap={6}
                className={ClassName.flatButton(3, '2px 6px')}
              >
                {i.icon && <Icon name={i.icon} />}
                <span>{i.text?.()}</span>
                {items.includes(i.key) && <Icon name="park-check" containerStyle={{ marginLeft: 'auto' }} />}
              </Content>
            ))}
          </WithBorder>
        }
      >
        <Reorder.Group
          as="div"
          onPointerEnter={() => {
            if (dragInto) return
            if (sidebarIconDraggingState.isDragging && sidebarIconDraggingState.draggingItem) {
              if (!items.some(o => o === sidebarIconDraggingState.draggingItem)) {
                setDragInto(true)
              }
            }
          }}
          onPointerLeave={() => {
            setDragInto(false)
          }}
          onPointerUp={() => {
            setDragInto(false)
            if (dragInto && sidebarIconDraggingState.draggingItem) {
              sidebarIconDraggingState.onDropOnOtherPos?.()
              onChange(Array.from(new Set([...items, sidebarIconDraggingState.draggingItem]).values()))
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            transition: 'all 0.2s ease',
            background: dragInto ? Colors.Common.SelectColorTransparent : undefined,
            minWidth: dragInto ? 44 : undefined,
            borderRight: direction === 'right' ? `1px solid ${Colors.Background.Border}` : undefined,
            borderLeft: direction === 'left' ? `1px solid ${Colors.Background.Border}` : undefined,
            padding: direction === 'left' && items.length === 0 ? 0 : undefined
          }}
          className={classNames(
            styles.list,
            css({
              display: 'flex',
              paddingBottom: '20px',
              paddingTop: 8,
              flexDirection: 'column',
              gap: 8,
              '*': {
                fontSize: FontSize['13px']
              }
            })
          )}
          onReorder={v => {
            onChange(v)
          }}
          values={items}
        >
          {showUser && <SidebarUser />}
          {items.map(
            i =>
              i && (
                <Reorder.Item
                  drag={true}
                  id={`sidebar-${i}`}
                  onDrag={() => {
                    isDraggingRef.current = true
                  }}
                  whileDrag={{ pointerEvents: 'none' }}
                  onContextMenuCapture={e => e.stopPropagation()}
                  onDragEnd={e => {
                    setSidebarIconDraggingState({
                      isDragging: false
                    })
                    setTimeout(() => {
                      isDraggingRef.current = false
                    })
                  }}
                  onDragStart={() => {
                    setSidebarIconDraggingState(s => ({
                      ...s,
                      isDragging: true,
                      draggingItem: i,
                      onDropOnOtherPos: () => {
                        const newItems = items.filter(o => o !== i)
                        onChange(newItems)
                      }
                    }))
                  }}
                  onClickCapture={e => {
                    if (isDraggingRef.current) {
                      e.stopPropagation()
                      isDraggingRef.current = false
                    }
                  }}
                  as="div"
                  key={i}
                  value={i}
                >
                  {renderSidebarItem(i)}
                </Reorder.Item>
              )
          )}
        </Reorder.Group>
      </ContextMenu>
    </>
  )
}

export default SidebarIcons
