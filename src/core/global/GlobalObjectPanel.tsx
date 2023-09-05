import Zindexes from '@/consts/zindex'
import { useGlobalAtomValue, useMergedRef, useShortcut, useToggle, useDebounceFn } from '@/hooks'
import { metaObjectsAtom, relatedMetaObjectsMapAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import { css } from '@emotion/css'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAtom, useAtomValue, useStore } from 'jotai/react'
import React, { forwardRef, memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MetaFilterGroup, MetaObject } from '~/typings/data'
import { AnimatePopover, Button, CheckBox, Content, Icon, Image, Tooltip, WithBorder } from '@/components'
import {
  AttachmentWrapper,
  CurrentFocusFilterAtom,
  DatabaseFilter,
  DraggableElement,
  FilterNameSearchAtom,
  FilterRelatedIdsAtom,
  FiltersAtom,
  GlobalDragOverlayInstance,
  GlobalGraphInstance,
  ObjectActionPopover,
  RelatedPanel,
  useDropObjectArea,
  useGlobalIsDragging,
  useObjectFilter,
  useRenderObject
} from '@/core'
import { selectAtom } from 'jotai/utils'
import produce from 'immer'
import { atom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { GlobalEventEmitter, useEventHandler } from '@/events'
import { LeftTopPosition } from '~/typings'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { Rendevoz } from '../rendevoz'
import _ from 'lodash'
import HoverObjectDetails from '@/core/database/HoverObjectDetails'
import { toast } from 'react-hot-toast'
import { GlobalLayout } from '@/components/layout'
import { DateFormat } from '@/utils'
import { calculateFilterObjects } from '@/core/database/filter/useBetterFilter'
import BetterFilter from '@/core/database/filter/BetterFilter'
import BetterSorter, { calculateSortObjects, SorterGroup } from '@/core/database/filter/BetterSorter'
import { go } from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

export const GlobalObjectPanelInstance: {
  open?: (position?: LeftTopPosition) => void
  close?: VoidFunction
} = {}
export const GlobalObjectPanel = () => {
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
    open: (position: LeftTopPosition) => {
      if (position) {
        const maxTop = window.innerHeight - panelState.size!.height - 20
        const maxLeft = window.innerWidth - panelState.size!.width - 20
        setPanelState(s => ({
          ...s,
          position: {
            top: Math.min(maxTop, position.top),
            left: Math.min(maxLeft, position.left)
          },
          visible: true
        }))
      } else {
        setPanelState(s => ({ ...s, visible: true }))
      }
    },
    close: () => setPanelState(s => ({ ...s, visible: false }))
  } as typeof GlobalObjectPanelInstance)
  const eventHandler = useEventHandler('global')
  const [isGlobalDragging] = useGlobalIsDragging()
  const [isAddingObject, toggleIsAddingObject] = useToggle(false)
  const promiseRef = useRef<{
    res?: any
    rej?: any
  }>()
  useEffect(() => {
    if (!panelState.visible) {
      promiseRef.current = undefined
      toggleIsAddingObject(false)
    }
  }, [panelState.visible])

  eventHandler.on('globalChooseMetaObject', (data, res, rej) => {
    toggleIsAddingObject(true)
    promiseRef.current = {
      res,
      rej
    }
  })

  useEffect(() => {
    GlobalEventEmitter().addListener('global', eventHandler)
    return () => {
      GlobalEventEmitter().removeListener('global', eventHandler)
    }
  }, [])

  useShortcut('openObjectPanel', () => {
    setPanelState(s => ({ ...s, visible: !s.visible }))
  })

  const handleAddObject = useCallback((id: number) => {
    promiseRef.current?.res(id)
    promiseRef.current = undefined
    GlobalObjectPanelInstance.close?.()
    toggleIsAddingObject(false)
  }, [])
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: Zindexes.ObjectPanel,
        pointerEvents: 'none'
      }}
      id="global-object-panel"
    >
      {panelState.visible && (
        <ResizeAndDrag
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
            borderRadius: 8,
            overflow: 'hidden'
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
          <ObjectPanel
            onClose={() => {
              setPanelState(s => ({ ...s, visible: false }))
            }}
            isAddingObject={isAddingObject}
            handleAddObject={handleAddObject}
          />
        </ResizeAndDrag>
      )}
    </div>,
    document.body,
    'object-panel'
  )
}

type ObjectPanelProps = {
  onClose?: VoidFunction
  isAddingObject: boolean
  handleAddObject: (id: number) => void
  padding?: number
  onOpenInTab?: VoidFunction
  visiblility?: {
    showOpenInTab?: boolean
    showClose?: boolean
    showCurrentTabObject?: boolean
  }
  showObjectDetails?: {
    id: number
  }
  renderFilterOnParent?: boolean
  onBackToList?: VoidFunction
}

const ObjectPanelFilterSortAtom = atom<{
  filter?: MetaFilterGroup
  filterVisible?: boolean
  sorterVisible?: boolean
  sorter?: SorterGroup
  searchInput?: string
  searchVisible?: boolean
}>({
  filterVisible: false,
  sorterVisible: false,
  searchInput: '',
  searchVisible: false,
  sorter: {
    sorters: []
  },
  filter: {
    groupType: 'and',
    filterType: 'group',
    rules: []
  }
})
export const ObjectPanel = memo(
  ({
    onClose,
    isAddingObject,
    handleAddObject,
    padding = 16,
    onOpenInTab,
    onBackToList,
    renderFilterOnParent,
    visiblility = { showClose: true },
    showObjectDetails
  }: ObjectPanelProps) => {
    const undeleteObjects = useAtomValue(undeletedMetaObjectsAtom, {
      store: globalStore
    })

    const { t } = useTranslation()
    const [filterSort, setFilterSort] = useAtom(ObjectPanelFilterSortAtom)
    const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(undeleteObjects)
    const [showBoxShadow, toggleShowBoxShadow] = useToggle(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const virtualizer = useVirtualizer({
      count: shouldDisplayObjects.length,
      estimateSize: () => 100,
      getScrollElement: () => containerRef.current,

      overscan: 5
    })
    const items = virtualizer.getVirtualItems()

    useEffect(() => {
      if (
        filterSort.filterVisible === false &&
        filterSort.sorterVisible === false &&
        (filterSort.filter?.rules.length || filterSort.sorter?.sorters.length || filterSort.searchInput)
      ) {
        const afterFilter =
          (filterSort.filter?.rules.length ? calculateFilterObjects(filterSort.filter) : undeleteObjects) || undeleteObjects
        const afterSearch = filterSort.searchInput
          ? Array.from(
              go(filterSort.searchInput, afterFilter, {
                keys: ['name', 'description']
              }).values()
            ).map(i => i.obj)
          : afterFilter
        const afterSort = filterSort.sorter?.sorters.length ? calculateSortObjects(afterSearch, filterSort.sorter) : afterSearch
        setShouldDisplayObjects(afterSort)
      }
      if (
        filterSort.filterVisible === false &&
        filterSort.sorterVisible === false &&
        !filterSort.filter?.rules.length &&
        !filterSort.sorter?.sorters.length &&
        !filterSort.searchInput
      ) {
        setShouldDisplayObjects(undeleteObjects)
      }
    }, [filterSort.filterVisible, undeleteObjects, filterSort.sorterVisible, filterSort.searchInput])

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

    const debounceSet = useDebounceFn(
      v => {
        setFilterSort(s => ({ ...s, searchInput: v }))
      },
      { wait: 500 }
    )
    const outerContainerRef = useRef<HTMLDivElement>(null)
    const { isDragging, canDropAsMeta } = useDropObjectArea(outerContainerRef, {
      onDrop: () => {
        if (canDropAsMeta.droppable) {
          Rendevoz.Events.Emit.GlobalEventEmitter.emit('global', {
            type: 'globalDropNeedFurtherProcess',
            data: {
              dropOn: {
                dropOn: 'database'
              },
              draggingElement: Rendevoz.Actions.State.Drag.getDraggingDetails()
            }
          })
        }
      }
    })
    return (
      <>
        <div
          ref={outerContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 9999,
            pointerEvents: isDragging ? 'auto' : 'none',
            opacity: isDragging ? 0.25 : 0,
            transition: 'opacity 0.25s ease',
            background: !canDropAsMeta.droppable ? Colors.Common.Red : Colors.Common.SelectColor
          }}
        ></div>
        <Content
          flex
          column
          gap={10}
          style={{
            padding
          }}
        >
          <Content
            flex
            justifyContent="space-between"
            style={{
              borderBottom: `1px solid ${Colors.Background.Border}`,
              cursor: 'grab',
              padding: '0px 0px 8px'
            }}
            className="global-drag-panel"
          >
            <div style={{ marginRight: 'auto' }} className={ClassName.title('1rem')}>
              {t('general.object library')}
              <span className={ClassName.description(FontSize['12px'])} style={{ marginLeft: 16 }}>{`${t('general.total objects')}: ${
                shouldDisplayObjects.length
              }`}</span>
            </div>
            {visiblility.showCurrentTabObject && (
              <Tooltip content={t("general.show current tab's object")}>
                <Icon
                  containerStyle={{ marginRight: 8 }}
                  name="park-hamburger-button"
                  className={ClassName.circleButton()}
                  onClick={() => {
                    const currentActiveTab = GlobalLayout?.getCurrentActiveTab()
                    if (currentActiveTab) {
                      const tab = currentActiveTab.tab
                      if (tab.objectId) {
                        const meta = MetaStore.getMetaObjectByObjectId(tab.objectId)
                        if (meta) {
                          Rendevoz.Actions.Open.openSidebarObjectDetails(meta.id)
                        }
                      }
                    }
                  }}
                />
              </Tooltip>
            )}
            {/*{visiblility.showOpenInTab && (*/}
            {/*  <Tooltip content={'Open Database In New Tab'}>*/}
            {/*    <Icon name="park-efferent-four" className={ClassName.circleButton()} onClick={onOpenInTab} />*/}
            {/*  </Tooltip>*/}
            {/*)}*/}
            {visiblility.showClose && <Icon name="park-close" className={ClassName.circleButton()} onClick={onClose} />}
          </Content>
          {filterSort.searchVisible && (
            <Content
              flex
              alignItems="center"
              gap={5}
              style={{
                fontSize: '13px',
                padding: '2px 6px',
                border: `1px solid ${Colors.Background.Border}`,
                borderRadius: 4
              }}
            >
              <Icon name={'park-search'} />
              <input
                autoFocus={true}
                className={ClassName.noStyleInput}
                style={{
                  flex: 1
                }}
                onChange={e => {
                  debounceSet.run(e.target.value)
                }}
                placeholder="Search content"
                defaultValue={filterSort.searchInput}
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    setFilterSort(s => ({ ...s, searchInput: e.target.value }))
                  }
                }}
                onBlur={e => {
                  setFilterSort(s => ({ ...s, searchInput: e.target.value }))
                }}
              />
              <Icon
                name={'park-close'}
                style={{
                  cursor: 'pointer'
                }}
                onClick={() => setFilterSort(s => ({ ...s, searchInput: '', searchVisible: false }))}
              />
            </Content>
          )}
          <Content flex gap={6}>
            <Button.IconButton
              gap={6}
              style={{
                fontSize: 12,
                padding: '2px 6px',
                border: `1px solid ${Colors.Background.Border}`
              }}
              onClick={() => setFilterSort(s => ({ ...s, searchVisible: !s.searchVisible }))}
              text={t('general.search')}
              icon="park-search"
            />
            <AnimatePopover
              padding={6}
              align="start"
              onVisiblityChange={v => [setFilterSort(s => ({ ...s, filterVisible: v }))]}
              positions={['bottom']}
              content={
                <WithBorder padding={8}>
                  <BetterFilter
                    onChange={v => {
                      setFilterSort(s => ({ ...s, filter: v }))
                    }}
                    root={filterSort.filter}
                  />
                </WithBorder>
              }
            >
              <Button.IconButton
                gap={6}
                style={{
                  fontSize: 12,
                  padding: '2px 6px',
                  border: `1px solid ${Colors.Background.Border}`
                }}
                text={t('filter.Filter')}
                icon="park-filter"
                suffixStr={filterSort.filter?.rules.length || undefined}
              />
            </AnimatePopover>
            <AnimatePopover
              padding={6}
              align="start"
              onVisiblityChange={v => [setFilterSort(s => ({ ...s, sorterVisible: v }))]}
              positions={['bottom']}
              content={
                <WithBorder padding={8}>
                  <BetterSorter root={filterSort.sorter} onChange={o => setFilterSort(s => ({ ...s, sorter: o }))} />
                </WithBorder>
              }
            >
              <Button.IconButton
                gap={6}
                style={{
                  fontSize: 12,
                  padding: '2px 6px',
                  border: `1px solid ${Colors.Background.Border}`
                }}
                text={t('filter.Sort')}
                icon="park-sort-one"
                suffixStr={filterSort.sorter?.sorters.length || undefined}
              />
            </AnimatePopover>
          </Content>
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
            padding: padding,
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
                      borderBottom: `1px solid ${Colors.Background.Border}`
                    },
                    padding: '8px 0px 6px'
                  })}
                >
                  <SimpleObject
                    metaObjectId={shouldDisplayObjects[row.index].id}
                    isAddingObject={isAddingObject}
                    onAddObject={handleAddObject}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {showObjectDetails?.id && (
          <Content flex column style={{ padding, position: 'absolute', left: '100%' }} fullWidth fullHeight>
            <ObjectDetailsPanel metaId={showObjectDetails.id} onBack={onBackToList} />
          </Content>
        )}
      </>
    )
  },
  (prev, curr) => prev.isAddingObject === curr.isAddingObject && prev.showObjectDetails === curr.showObjectDetails
)

export const ObjectDetailsPanel = ({ metaId, onBack }: { metaId: number; onBack?: VoidFunction }) => {
  const { renderWhole, metaObject, renderTags, renderFrom } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  const relatedMap = useGlobalAtomValue(relatedMetaObjectsMapAtom)
  const allRelatedByType = useMemo(() => {
    const allRelatedIds = Array.from(relatedMap.get(metaId) || [])
    const allRelatedByType = _.groupBy(
      allRelatedIds.map(id => globalStore.get(metaObjectsAtom).get(id)),
      i => i.type
    )
    return allRelatedByType
  }, [relatedMap, metaId])
  const [currentDisplayRelated, setCurrentDisplayRelated] = useState<MetaObject['type']>()
  const [showAllRelated, setShowAllRelated] = useState(false)
  const [attachmentVisible, setAttachmentVisible] = useState(false)
  useEffect(() => {
    if (showAllRelated) {
      setShowAllRelated(false)
    }
    setAttachmentVisible(false)
  }, [metaId])
  return (
    <Content flex column fullWidth fullHeight style={{ paddingBottom: 40 }}>
      <Content flex style={{ marginBottom: 24 }}>
        <Icon
          name="park-left"
          onClick={() => {
            if (showAllRelated) {
              setShowAllRelated(false)
            } else {
              onBack?.()
            }
          }}
          containerStyle={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}
          className={ClassName.circleButton()}
        />
        <div style={{ margin: 'auto', fontWeight: 600, fontSize: '0.9rem' }}>
          {showAllRelated ? t('general.related objects') : t('general.object details')}
        </div>
      </Content>

      {showAllRelated ? (
        <RelatedPanel metaId={metaId} />
      ) : (
        <>
          <Content flex alignItems="center" gap={10}>
            {metaObject?.coverImgSrc && <Image src={metaObject.coverImgSrc} preview width={60} containerStyle={{ borderRadius: 10 }} />}
            <Content>
              <Content>{renderTags({})}</Content>
              <DraggableElement draggingDetails={{ type: 'metaElement', metaId: metaId }}>
                <div
                  onClick={() => Rendevoz.Actions.Open.Meta.openMetaObject(metaId)}
                  style={{ fontSize: '0.9rem', textTransform: 'none', cursor: 'pointer' }}
                >
                  {metaObject?.name}
                </div>
              </DraggableElement>
            </Content>
          </Content>
          {metaObject?.fromObject && (
            <>
              <div style={{ marginTop: 12 }} className={ClassName.description()}>
                {t('general.from')}
              </div>
              {renderFrom({})}
            </>
          )}
          {metaObject?.description && (
            <>
              <div style={{ marginTop: 12 }} className={ClassName.description()}>
                {t('general.description')}
              </div>
              <div className={ClassName.description()} style={{ textTransform: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {metaObject.description}
              </div>
            </>
          )}
          {metaObject?.createdAt && (
            <div className={ClassName.description()} style={{ marginTop: 12 }}>
              {t('general.create at')}: {DateFormat.formatDistanceToNowStrict(metaObject.createdAt, true)}
            </div>
          )}
          {metaObject?.viewAt && (
            <div className={ClassName.description()}>
              {t('general.view at')}: {DateFormat.formatDistanceToNowStrict(metaObject.viewAt, true)}
            </div>
          )}
          {Object.keys(allRelatedByType).length > 0 && (
            <>
              <Content flex style={{ marginBottom: 4, marginTop: 12 }} className={ClassName.description()}>
                <div>{t('general.related objects')}</div>
                <div onClick={() => setShowAllRelated(true)} style={{ marginLeft: 'auto', cursor: 'pointer' }}>
                  {t('general.show details')}
                </div>
              </Content>
              <Content flex gap={6} style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                {Object.entries(allRelatedByType).map(k => (
                  <div
                    key={k[0]}
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => {
                      setCurrentDisplayRelated(k[0])
                    }}
                    className={ClassName.objectTag}
                  >
                    {Rendevoz.Utils.Meta.getTypeName(k[0])}: {k[1].length}
                  </div>
                ))}
              </Content>
            </>
          )}
          {((metaObject?.attachments && metaObject?.attachments?.length > 0) || attachmentVisible) && (
            <AttachmentWrapper
              renderObjectDetailsOnParent={false}
              renderAttOnParent={false}
              style={{
                margin: '30px 0px'
              }}
              closeIcon={!metaObject?.attachments?.length}
              visible={true}
              onClose={() => setAttachmentVisible(false)}
              metaId={metaId}
            />
          )}
          <div className={ClassName.description()} style={{ margin: 'auto 0px 0px 6px' }}>
            {t('general.more actions')}
          </div>
          <Button.IconButton
            text={t('general.edit')}
            icon="park-edit"
            onClick={() => {
              GlobalEventEmitter().emit('global', {
                type: 'globalNeedEditMetaObject',
                data: {
                  metaObjectId: metaId
                }
              })
            }}
          />{' '}
          <Button.IconButton
            text={t('general.global graph')}
            icon="park-circle-four-line"
            onClick={() => {
              GlobalGraphInstance?.open?.(metaObject)
            }}
          />
          <Button.IconButton
            text={t('general.partial graph')}
            icon="park-share-one"
            onClick={() => {
              GlobalGraphInstance?.open?.(metaObject, true)
            }}
          />
          <Button.IconButton
            text={t('general.add attachment')}
            icon="park-link"
            onClick={() => {
              setAttachmentVisible(true)
            }}
          />
          <Button.IconButton
            text={t('general.generate link')}
            onClick={() => {
              const link = `rendevoz://object/${metaId}`
              navigator.clipboard.writeText(link)
              toast.success(
                <Content className={ClassName.description()}>
                  <div style={{ textTransform: 'none' }}>{t('general.link is generated for this object')}!</div>
                  <div style={{ userSelect: 'all', textTransform: 'none' }}>{link}</div>
                </Content>
              )
            }}
            icon="park-link-two"
          />
        </>
      )}
    </Content>
  )
}
export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        iconName = 'park-drag',
        iconPopover,
        descriptionClassName = css([ClassName.description(), ClassName.ellipsisFont(2)]),
        onNavigate,
        draggable = true,
        renderFrom = true,
        renderDescription = false,
        isAddingObject,
        iconTheme,
        iconColor = Colors.Font.Secondary,
        heavyIconColor = Colors.Font.Primary,
        onAddObject,
        showIcon = false,
        onIconClick
      }: {
        metaObjectId: number
        iconName?: string
        iconColor?: string
        iconTheme?: string
        heavyIconColor?: string
        iconPopover?: ReactElement
        descriptionClassName?: string
        onNavigate?: VoidFunction
        draggable?: boolean
        renderDescription?: boolean
        renderFrom?: boolean
        isAddingObject?: boolean
        onAddObject?: (id: number) => void
        showIcon?: boolean
        onIconClick?: (e: React.MouseEvent, togglePopoverVisible: React.SetStateAction<boolean>) => void
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const mergedRef = useMergedRef(containerRef, ref)
      const isPressed = useRef(false)
      const { renderWhole, metaObject } = useRenderObject({
        metaObjectId: metaObjectId
      })
      const [hovered, setHovered] = useState(false)
      const [popoverContainerVisible, togglePopoverContainerVisible] = useState(false)
      const [popoverVisible, togglePopoverVisible] = useToggle(false)
      const [showCheckBox, toggleShowCheckBox] = useToggle(false)
      const firstDragTimeRef = useRef<number>(0)
      const currentFocusFilter = useAtomValue(CurrentFocusFilterAtom)
      const filters = useAtomValue(FiltersAtom)
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

      useEffect(() => {
        if (popoverVisible === false) {
          setTimeout(() => {
            togglePopoverContainerVisible(false)
          }, 300)
        } else {
          togglePopoverContainerVisible(true)
        }
      }, [popoverVisible])
      const renderOptions = useMemo(
        () => ({
          tagAboveImage: true,
          renderOptions: {
            renderFrom,
            renderDescription,
            renderOriginalText: false
          },
          containerStyle: {
            width: '100%'
          },
          mainContainerStyle: {
            flex: 1,
            width: 0
          },
          fromOptions: {
            style: {
              margin: 0,
              fontSize: '0.8rem'
            },
            className: ClassName.ellipsisFont(1)
          },
          tagsOptions: {
            showCreatedAt: filters.some(i => i.filterType === 'createdAt'),
            showViewAt: filters.some(i => i.filterType === 'viewAt')
          },
          titleOptions: {
            style: {
              fontSize: FontSize['13px']
            },
            titleClassName,
            onTitleClick: () => {
              Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
              onNavigate?.()
            }
          },
          rowGap: 10,
          descriptionOptions: {
            style: {
              fontSize: FontSize['12px']
            },
            descriptionClassName
          }
        }),
        [filters, metaObjectId]
      )
      return (
        <Content
          onPointerOver={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          flex
          ref={mergedRef}
          alignItems="center"
          gap={4}
        >
          <Content fullWidth fullHeight flex={!metaObject?.coverImgSrc}>
            {renderWhole(renderOptions)}
          </Content>
          <div
            style={{
              marginLeft: 'auto',
              display: hovered || popoverContainerVisible || popoverVisible || showCheckBox || showIcon ? undefined : 'none',
              opacity: hovered || popoverVisible || showCheckBox || showIcon ? 1 : 0
            }}
          >
            {showCheckBox ? (
              <CheckBox
                style={{ flexShrink: 0, margin: '0px 4px' }}
                checked={currentRelatedIds?.has(metaObjectId)}
                onChange={handleClickCheckBox}
              />
            ) : isAddingObject ? (
              <Icon onClick={() => onAddObject?.(metaObjectId)} size={16} name="park-plus" className={ClassName.circleButton(3)}></Icon>
            ) : (
              <AnimatePopover
                visible={popoverVisible}
                innerRef={iconRef}
                padding={10}
                containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
                onClickOutside={() => {
                  togglePopoverVisible(false)
                }}
                content={
                  <WithBorder>
                    {iconPopover || <ObjectActionPopover onClose={togglePopoverVisible} metaObjectId={metaObjectId} />}
                  </WithBorder>
                }
                align="start"
                positions={['right', 'left']}
              >
                <Icon
                  size={16}
                  fill={iconColor}
                  onClick={e => onIconClick?.(e, togglePopoverVisible) || togglePopoverVisible()}
                  name={iconName}
                  theme={iconTheme}
                  className={css([
                    ClassName.circleButton(3),
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
          </div>
        </Content>
      )
    }
  )
)

const titleClassName = css([
  ClassName.ellipsisFont(2),
  ClassName.title(FontSize['14px']),
  {
    position: 'relative',
    width: 'fit-content',
    maxWidth: '100%',
    textDecoration: 'underline 1px rgba(0,0,0,0)',
    transition: 'text-decoration-color 0.3s ease',
    ':hover': {
      textDecorationColor: 'inherit'
    },
    cursor: 'pointer'
  }
])
