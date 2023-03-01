import Zindexes from '@/consts/zindex'
import { useMemoizedFn, useMergedRef, useToggle } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore, metaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import { css } from '@emotion/css'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAtom, useAtomValue } from 'jotai/react'
import { forwardRef, memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Rnd } from 'react-rnd'
import { MetaObject } from '~/typings/data'
import { AnimatePopover, Content, Icon, Image, WithBorder } from './base'
import Modal from './base/Modal'
import EditMetaObjectForm, { Tag } from './form/EditMetaObjectForm'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from './globalDragOverlay/GlobalDragOverlay'
import { useSetting } from './globalSetting/Main'
import { ObjectActionPopover, TypeToTypeName } from './database/card/DatabaseCard'
import DatabaseFilter from './database/filter'
import useObjectFilter, { FilterNameSearchAtom } from './database/filter/useObjectFilter'
import { compareHotkey } from 'is-hotkey'
import { useNavigate } from 'react-router-dom'

const GlobalObjectPanel = () => {
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
      left: 300,
      top: 300
    },
    size: {
      width: Math.min(window.innerWidth * 0.2, 400),
      height: Math.min(window.innerHeight * 0.4, 500)
    }
  })
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
  })
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
              <div className={ClassName.title('14px')}>Objects Panel</div>
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
                placeholder="Search For Object"
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
                    <SimpleObject metaObject={shouldDisplayObjects[row.index]} />
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

const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObject
      }: {
        metaObject: MetaObject
      },
      ref
    ) => {
      const { coverImgSrc, name, description, tags, type } = metaObject
      const containerRef = useRef<HTMLDivElement>(null)
      const mergedRef = useMergedRef(containerRef, ref)
      const isPressed = useRef(false)
      const [popoverVisible, togglePopoverVisible] = useToggle(false)
      const [editVisible, toggleEditVisible] = useToggle(false)
      // const navigate = useNavigate()
      const { updateMetaObject } = metaStore
      const handleDragStart = () => {
        const container = containerRef.current
        if (container) {
          const cloned = container.cloneNode(true) as HTMLElement
          const bound = container.getBoundingClientRect()
          cloned.style.setProperty('width', `${bound.width}px`)
          cloned.style.setProperty('height', `${bound.height}px`)
          GlobalDragOverlayInstance.addDragElements?.(cloned)
          GlobalDragOverlayInstance.draggingDetails = {
            type: 'metaElement',
            metaId: metaObject.id
          }
          isPressed.current = true
        }
      }
      const handleDrag = () => {
        if (isPressed.current) {
          GlobalDragOverlayInstance.startDrag?.()
        }
      }
      const handleDragEnd = () => {
        isPressed.current = false
      }
      // const handleTitleClick = () => {
      //   switch (metaObject.type) {
      //     case 'pdf': {
      //       navigate(`/pdf/${metaObject.objectId}`)
      //     }
      //   }
      // }
      const iconRef = useRef<HTMLDivElement>(null)

      useEffect(() => {
        iconRef.current?.addEventListener('pointerdown', handleDragStart)
        iconRef.current?.addEventListener('pointermove', handleDrag)
        document.addEventListener('pointerup', handleDragEnd)
        return () => {
          iconRef.current?.removeEventListener('pointerdown', handleDragStart)
          iconRef.current?.removeEventListener('pointermove', handleDrag)
          document.removeEventListener('pointerup', handleDragEnd)
        }
      })
      return (
        <Content flex ref={mergedRef} alignItems="center" gap={10}>
          <Modal noStyle visible={editVisible} onClose={toggleEditVisible}>
            <EditMetaObjectForm
              title="Edit Object"
              metaObject={metaObject}
              onUpdate={obj => {
                toggleEditVisible()
                updateMetaObject(obj)
              }}
              onClose={toggleEditVisible}
            />
          </Modal>
          <AnimatePopover
            visible={popoverVisible}
            innerRef={iconRef}
            padding={10}
            containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
            onClickOutside={togglePopoverVisible}
            content={
              <WithBorder>
                <ObjectActionPopover onEdit={toggleEditVisible} onClose={togglePopoverVisible} metaObjectId={metaObject.id} />
              </WithBorder>
            }
            align="start"
            positions={['left', 'right']}
          >
            <Icon
              size={18}
              fill="rgba(31,34,39,0.2)"
              onClick={togglePopoverVisible}
              name="park-drag"
              className={css([
                ClassName.circleButton(),
                {
                  color: 'rgba(31,34,39,0.2)',
                  ':hover': {
                    color: 'rgba(31,34,39,0.7)'
                  }
                }
              ])}
            />
          </AnimatePopover>
          {coverImgSrc && <Image src={coverImgSrc} width={50} style={{ borderRadius: 6 }} />}
          <Content flex column gap={2}>
            <Content
              flex
              gap={4}
              className={css({
                '> *': {
                  fontSize: '10px !important'
                }
              })}
            >
              <div className={ClassName.objectTag}>{TypeToTypeName[type || 'normal']}</div>
              {tags?.map(i => (
                <Tag small hideDetails hideSize tag={i} />
              ))}
            </Content>
            <div className={ClassName.title('14px')}>{name}</div>
            <div className={css([ClassName.ellipsisFont(2), ClassName.description('12px')])}>{description}</div>
          </Content>
        </Content>
      )
    }
  )
)
export default GlobalObjectPanel
