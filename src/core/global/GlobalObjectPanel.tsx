import Zindexes from '@/consts/zindex'
import { useMemoizedFn, useMergedRef, useToggle } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import { css } from '@emotion/css'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAtom, useAtomValue, useStore } from 'jotai/react'
import { forwardRef, memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Rnd } from 'react-rnd'
import { MetaObject } from '~/typings/data'
import { AnimatePopover, CheckBox, Content, Icon, WithBorder, Modal } from '@/components'
import {
  GlobalDragOverlayInstance,
  useGlobalIsDragging,
  CurrentFocusFilterAtom,
  FilterNameSearchAtom,
  FilterRelatedIdsAtom,
  useObjectFilter,
  DatabaseFilter,
  ObjectActionPopover
} from '@/core'
import { useSetting } from '@/core/setting'
import { compareHotkey } from 'is-hotkey'
import ObjectForm from '@/components/form/ObjectForm'
import { selectAtom } from 'jotai/utils'
import produce from 'immer'
import { atom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { useRenderObject } from '@/core'
import Actions from '@/core/Actions'

export const GlobalObjectPanelInstance: {
  open?: VoidFunction
  close?: VoidFunction
} = {}
export const GlobalObjectPanel = () => {
  const [search, setSearch] = useAtom(FilterNameSearchAtom)
  const [panelState, setPanelState] = useState<
    Partial<{
      visible: boolean
      position: Position
      size: { width: number; height: number }
    }>
  >({
    visible: false,
    position: {
      left: Math.min(window.innerWidth * 0.2, 200),
      top: Math.min(window.innerHeight * 0.1, 100)
    },
    size: {
      width: Math.min(window.innerWidth * 0.4, 400),
      height: Math.min(window.innerHeight * 0.8, 500)
    }
  })
  Object.assign(GlobalObjectPanelInstance, {
    open: () => setPanelState(s => ({ ...s, visible: true })),
    close: () => setPanelState(s => ({ ...s, visible: false }))
  } as typeof GlobalObjectPanelInstance)
  const { t } = useTranslation()
  const [showBoxShadow, toggleShowBoxShadow] = useToggle(false)
  const undeleteObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })
  const [setting] = useSetting()
  const [isGlobalDragging] = useGlobalIsDragging()
  const containerRef = useRef<HTMLDivElement>(null)

  const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(undeleteObjects)

  const virtualizer = useVirtualizer({
    count: shouldDisplayObjects.length,
    estimateSize: () => 100,
    getScrollElement: () => containerRef.current,

    overscan: 10
  })
  useObjectFilter(ids => {
    const shouldDisplay = undeleteObjects.filter(i => ids.has(i.id))
    setShouldDisplayObjects(shouldDisplay)
  })
  const keyDownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (setting.shortcut.openObjectPanel && compareHotkey(setting.shortcut.openObjectPanel, e)) {
      setPanelState(s => ({ ...s, visible: !s.visible }))
    }
  })
  useEffect(() => {
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [])
  useEffect(() => {
    const container = containerRef.current
    const containerScrollHandler = (e: Event) => {
      if ((e.target as HTMLElement).scrollTop > 0) {
        toggleShowBoxShadow(true)
      } else {
        toggleShowBoxShadow(false)
      }
    }
    if (container) {
      container.addEventListener('scroll', containerScrollHandler)
    }
    return () => {
      container?.removeEventListener('scroll', containerScrollHandler)
    }
  }, [])
  const items = virtualizer.getVirtualItems()
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: Zindexes.CreateObjectPanel,
        pointerEvents: 'none'
      }}
    >
      {panelState.visible && (
        <Rnd
          style={{
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Muli',
            pointerEvents: isGlobalDragging ? 'none' : 'auto',
            opacity: isGlobalDragging ? 0.1 : 1,
            transition: 'opacity 0.3s ease',
            position: 'relative',
            paddingBottom: 0,
            borderRadius: 8
          }}
          dragHandleClassName="global-drag-panel"
          size={panelState.size}
          position={{
            x: panelState.position?.left,
            y: panelState.position?.top
          }}
          onResizeStop={(e, dir, ele, delta, pos) => {
            const bound = ele.getBoundingClientRect()
            setPanelState({
              ...panelState,
              size: {
                width: bound.width,
                height: bound.height
              },
              position: {
                left: pos.x,
                top: pos.y
              }
            })
          }}
          onDragStop={(e, data) => {
            setPanelState({
              ...panelState,
              position: {
                left: data.x,
                top: data.y
              }
            })
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: -1
            }}
            className={ClassName.Background.blurBackground}
          ></div>
          <Content
            flex
            column
            gap={10}
            style={{
              padding: '16px'
            }}
          >
            <Content
              flex
              justifyContent="space-between"
              style={{
                borderBottom: '1px solid rgba(0,0,0,0.07)',
                cursor: 'grab',
                padding: '0px 0px 8px'
              }}
              className="global-drag-panel"
            >
              <div className={ClassName.title('14px')}>{t('dialog.object panel', { object: t('general.object') })}</div>
              <Icon
                name="park-close"
                className={ClassName.circleButton()}
                fill="rgba(0,0,0,0.3)"
                onClick={() => {
                  setPanelState({ ...panelState, visible: false })
                }}
              />
            </Content>
            <Content
              style={{
                background: 'transparent',
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,0.1)',
                padding: '6px 12px'
              }}
              flex
              alignItems="center"
              gap={10}
            >
              <Icon name="park-search" />
              <input
                placeholder={t('dialog.search for object', { object: t('general.object') })}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={css({
                  border: 'none',
                  outline: 'none',
                  background: 'inherit',
                  flexGrow: 1
                })}
              />
            </Content>
            <DatabaseFilter />
          </Content>
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              fontFamily: 'Muli',
              position: 'relative',
              padding: '16px',
              paddingTop: 0,
              boxShadow: showBoxShadow ? 'rgb(55 53 47 / 9%) 0px 4px 3px -3px inset' : undefined,
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${items[0]?.start}px)`
                }}
              >
                {items.map(row => (
                  <div
                    key={row.key}
                    data-index={row.index}
                    ref={virtualizer.measureElement}
                    className={css({
                      ':first-child': {
                        paddingTop: 0
                      },
                      ':not(:last-child)': {
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                      },
                      padding: '10px 0px'
                    })}
                  >
                    <SimpleObject metaObjectId={shouldDisplayObjects[row.index].id} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Rnd>
      )}
    </div>,
    document.body,
    'object-panel'
  )
}

export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        iconName = 'park-drag',
        iconPopover,
        iconColor = 'rgba(31,34,39,0.2)',
        heavyIconColor = 'rgba(31,34,39,0.7)',
        descriptionClassName = ClassName.description(),
        onNavigate,
        draggable = true
      }: {
        metaObjectId: number
        iconName?: string
        iconColor?: string
        heavyIconColor?: string
        iconPopover?: ReactElement
        descriptionClassName?: string
        onNavigate?: VoidFunction
        draggable?: boolean
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const mergedRef = useMergedRef(containerRef, ref)
      const isPressed = useRef(false)
      const { renderWhole, metaObject } = useRenderObject({
        metaObjectId: metaObjectId,
      })
      const [popoverVisible, togglePopoverVisible] = useToggle(false)
      const [editVisible, toggleEditVisible] = useToggle(false)
      const [showCheckBox, toggleShowCheckBox] = useToggle(false)
      const { updateMetaObject } = MetaStore
      const firstDragTimeRef = useRef<number>(0)
      const currentFocusFilter = useAtomValue(CurrentFocusFilterAtom)
      const currentRelatedIdsAtom = useMemo(() => {
        if (currentFocusFilter) {
          if (currentFocusFilter.id && currentFocusFilter.type === 'related') {
            const idsAtom = selectAtom(FilterRelatedIdsAtom, f => f.get(currentFocusFilter.id))
            return idsAtom
          }
        }
        return atom(null)
      }, [currentFocusFilter?.id])
      const currentRelatedIds = useAtomValue(currentRelatedIdsAtom)
      useEffect(() => {
        if (currentFocusFilter) {
          if (currentFocusFilter.type === 'related') {
            toggleShowCheckBox(true)
          }
        } else {
          toggleShowCheckBox(false)
        }
      }, [currentFocusFilter])
      const store = useStore()

      const handleDragStart = () => {
        const container = containerRef.current
        firstDragTimeRef.current = Date.now()
        if (container) {
          const cloned = container.cloneNode(true) as HTMLElement
          const bound = container.getBoundingClientRect()
          cloned.style.setProperty('width', `${bound.width}px`)
          cloned.style.setProperty('height', `${bound.height}px`)
          GlobalDragOverlayInstance.addDragElements?.(cloned)
          GlobalDragOverlayInstance.draggingDetails = {
            type: 'metaElement',
            metaId: metaObjectId
          }
          isPressed.current = true
        }
      }
      const handleDrag = () => {
        if (isPressed.current) {
          const now = Date.now()
          // add a delay to prevent uncarefully drag
          if (now - firstDragTimeRef.current > 100) {
            GlobalDragOverlayInstance.startDrag?.()
          }
        }
      }
      const handleDragEnd = () => {
        isPressed.current = false
      }
      const iconRef = useRef<HTMLDivElement>(null)

      useEffect(() => {
        if (draggable) {
          iconRef.current?.addEventListener('pointerdown', handleDragStart)
          document.addEventListener('pointermove', handleDrag)
          document.addEventListener('pointerup', handleDragEnd)
          return () => {
            iconRef.current?.removeEventListener('pointerdown', handleDragStart)
            document.removeEventListener('pointermove', handleDrag)
            document.removeEventListener('pointerup', handleDragEnd)
          }
        }
      })

      const handleClickCheckBox = (checked: boolean) => {
        if (currentFocusFilter?.id) {
          if (checked) {
            store.set(
              FilterRelatedIdsAtom,
              produce(store.get(FilterRelatedIdsAtom), draft => {
                if (draft.has(currentFocusFilter.id)) {
                  draft.get(currentFocusFilter.id)?.add(metaObjectId)
                } else {
                  draft.set(currentFocusFilter.id, new Set([metaObjectId]))
                }
              })
            )
          } else {
            store.set(
              FilterRelatedIdsAtom,
              produce(store.get(FilterRelatedIdsAtom), draft => {
                draft.get(currentFocusFilter.id)?.delete(metaObjectId)
              })
            )
          }
        }
      }
      return (
        <Content flex ref={mergedRef} alignItems="center" gap={10}>
          <Modal noStyle visible={editVisible} onClose={toggleEditVisible}>
            <ObjectForm
              initialObject={metaObject}
              onSubmit={obj => {
                toggleEditVisible()
                updateMetaObject(obj)
              }}
              onBack={toggleEditVisible}
            />
          </Modal>
          {showCheckBox ? (
            <CheckBox
              style={{ flexShrink: 0, margin: '0px 4px' }}
              checked={currentRelatedIds?.has(metaObjectId)}
              onChange={handleClickCheckBox}
            />
          ) : (
            <AnimatePopover
              visible={popoverVisible}
              innerRef={iconRef}
              padding={10}
              containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
              onClickOutside={togglePopoverVisible}
              content={
                <WithBorder>
                  {iconPopover || (
                    <ObjectActionPopover onEdit={toggleEditVisible} onClose={togglePopoverVisible} metaObjectId={metaObjectId} />
                  )}
                </WithBorder>
              }
              align="start"
              positions={['left', 'right']}
            >
              <Icon
                size={18}
                fill={iconColor}
                onClick={togglePopoverVisible}
                name={iconName}
                className={css([
                  ClassName.circleButton(),
                  {
                    color: iconColor,
                    ':hover': {
                      color: heavyIconColor
                    }
                  }
                ])}
              />
            </AnimatePopover>
          )}
          {renderWhole({
            renderOptions: {
              renderFrom: true
            },
            fromOptions: {
              containerStyle: {
                margin: 0
              }
            },
            titleOptions: {
              style: {
                fontSize: 14
              },
              onTitleClick: () => {
                Actions.navigateToTargetObject(metaObjectId)
                onNavigate?.()
              }
            },
            descriptionOptions: {
              style: {
                fontSize: 12
              },
              descriptionClassName
            }
          })}
        </Content>
      )
    }
  )
)
