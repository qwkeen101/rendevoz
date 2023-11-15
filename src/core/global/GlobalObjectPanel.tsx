import { useGlobalAtomValue, useMergedRef, useDebounceFn } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/api/stores/meta.store'
import { MetaStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtom } from 'jotai/react'
import React, { forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import { MetaFilterGroup, MetaObject } from '~/typings/data'
import { AnimatePopover, Button, Content, Icon, Tooltip, WithBorder, VirtualList } from '@/components'
import { DraggableElement, useDropObjectArea, useRenderObject } from '@/core'
import { atom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { LeftTopPosition } from '~/typings'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import { Rendevoz } from '../rendevoz'
import { GlobalLayout } from '@/components/layout'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import BetterFilter from '@/core/object/filter/BetterFilter'
import BetterSorter, { calculateSortObjects, SorterGroup } from '@/core/object/filter/BetterSorter'
import { go } from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

export const GlobalObjectPanelInstance: {
  open?: (position?: LeftTopPosition) => void
  close?: VoidFunction
} = {}

type ObjectPanelProps = {
  onClose?: VoidFunction
  isAddingObject: boolean
  handleAddObject: (id: number) => void
  padding?: number | string
  visiblility?: {
    showOpenInTab?: boolean
    showClose?: boolean
    showCurrentTabObject?: boolean
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
  ({ onClose, isAddingObject, handleAddObject, padding = 16, visiblility = { showClose: true } }: ObjectPanelProps) => {
    const undeleteObjects = useGlobalAtomValue(undeletedMetaObjectsAtom)

    const { t } = useTranslation()
    const [filterSort, setFilterSort] = useAtom(ObjectPanelFilterSortAtom)
    const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(undeleteObjects)

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
    console.log('rerender')
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
          gap={8}
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
        <VirtualList
          itemContainerClassname={css({
            '>': {
              ':not(:last-child)': {
                borderBottom: `1px solid ${Colors.Background.Border}`
              }
            }
          })}
          itemStyle={{
            paddingTop: 8,
            paddingBottom: 8
          }}
          items={shouldDisplayObjects}
          renderItem={item => <SimpleObject metaObjectId={item.id} isAddingObject={isAddingObject} onAddObject={handleAddObject} />}
          estimateSize={40}
          style={{
            width: '100%',
            height: '100%',
            padding: '0px 8px'
          }}
        ></VirtualList>
      </>
    )
  }
)

export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        descriptionClassName = css([ClassName.description(), ClassName.ellipsisFont(2)]),
        onNavigate,
        renderFrom = true,
        renderDescription = false
      }: {
        metaObjectId: number
        descriptionClassName?: string
        onNavigate?: VoidFunction
        renderDescription?: boolean
        renderFrom?: boolean
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const mergedRef = useMergedRef(containerRef, ref)
      const { renderWhole, metaObject } = useRenderObject({
        metaObjectId: metaObjectId
      })
      const renderOptions = useMemo(
        () => ({
          tagAboveImage: true,
          renderOptions: {
            renderFrom,
            renderDescription,
            renderOption: true,
            renderOriginalText: true
          },
          optionOptions: {
            style: {
              right: 0,
              top: -1
            },
            renderOnParent: false
          },
          containerStyle: {
            width: '100%'
          },
          mainContainerStyle: {
            flex: 1,
            width: 0
          },
          titleOptions: {
            showAddNote: false,
            style: {
              fontSize: '14px',
              lineHeight: 1.3
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
        [metaObjectId]
      )
      return (
        <DraggableElement
          dragHandleClassName={titleClassName}
          ref={mergedRef}
          draggingDetails={{
            type: 'metaElement',
            metaId: metaObjectId
          }}
        >
          <Content flex alignItems="center" gap={4}>
            <Content fullWidth fullHeight flex={!metaObject?.coverImgSrc}>
              {renderWhole(renderOptions)}
            </Content>
          </Content>
        </DraggableElement>
      )
    }
  )
)

const titleClassName = css([
  ClassName.ellipsisFont(3),
  ClassName.title(FontSize['14px']),
  {
    cursor: 'pointer',
    transition: 'color 0.16s ease',
    ':hover': {
      color: Colors.Common.SelectColor
    }
  }
])
