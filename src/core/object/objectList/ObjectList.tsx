import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useGlobalAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/api/stores/meta/meta.store'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import { go } from 'fuzzysort'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { previewCollectionContentAtom, previewSidebarTitleAtom, SettingAtom, SimpleObject, useDropObjectArea } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import Colors from '../../../consts/colors'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, Menu, Tooltip, VirtualList, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { useMeasure } from 'react-use'
import useDisplayInside from '@/core/object/objectList/useDisplayInside'
import useSidebarDatabaseState from '@/components/layout/sidebar/useSidebarDatabaseState'
import { chunk } from 'lodash'

export default memo(() => {
  const undeleteObjects = useGlobalAtomValue(undeletedMetaObjectsAtom)
  const [filterSort, setSidebarDatabaseState] = useSidebarDatabaseState()
  const defaultHideHighlights = useSelectGlobalAtomValue(SettingAtom, s => s.sidebar.hideHighlights)
  const { renderContains, contains, renderContainIndicator } = useDisplayInside({
    defaultSelected: filterSort.selectedMeta || [],
    onSelect: v => {
      setSidebarDatabaseState(s => ({ ...s, selectedMeta: v }))
    }
  })
  const showTempAndHidden = contains?.length
  const setFilterSort = setSidebarDatabaseState
  const sortMode = filterSort?.sort || 'create'
  const { t } = useTranslation()

  const showHiddenMetasInObjectPanel = KeyvalueStore.useValue('showHiddenMetasInSidebar') ?? false
  const showHidden = showTempAndHidden || showHiddenMetasInObjectPanel
  const all = contains || undeleteObjects
  const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(
    all.filter(i =>
      MetaStore.isVisibleMetaObject(i, {
        temp: !!showTempAndHidden,
        hidden: !!(showTempAndHidden || showHidden)
      })
    )
  )
  useEffect(() => {
    if (filterSort.filterVisible === false && (filterSort.filter?.rules.length || filterSort.searchInput)) {
      const afterFilter =
        (filterSort.filter?.rules.length
          ? calculateFilterObjects(
              filterSort.filter,
              all.map(i => i.id),
              true
            )
          : all) || all
      const afterSearch = filterSort.searchInput
        ? Array.from(
            go(filterSort.searchInput, afterFilter, {
              keys: ['name', 'description', 'placeholderName']
            }).values()
          ).map(i => i.obj)
        : afterFilter
      const afterSort = calculateSortObjects(afterSearch, {
        sorters: [
          sortMode === 'create'
            ? {
                field: 'createdAt',
                id: 1,
                type: 'descending'
              }
            : {
                field: 'viewAt',
                id: 2,
                type: 'descending'
              }
        ]
      })
      const final = afterSort.filter(i =>
        MetaStore.isVisibleMetaObject(i, {
          temp: !!showTempAndHidden,
          hidden: !!(showTempAndHidden || showHidden)
        })
      )
      setShouldDisplayObjects(final)
    }
    if (filterSort.filterVisible === false && !filterSort.filter?.rules.length && !filterSort.searchInput) {
      const afterSort = calculateSortObjects(all, {
        sorters: [
          sortMode === 'create'
            ? {
                field: 'createdAt',
                id: 1,
                type: 'descending'
              }
            : {
                field: 'viewAt',
                id: 2,
                type: 'descending'
              }
        ]
      })
      const final = afterSort.filter(i =>
        MetaStore.isVisibleMetaObject(i, {
          temp: !!showTempAndHidden,
          hidden: !!(showTempAndHidden || showHidden),
          hideLabel: defaultHideHighlights && !contains
        })
      )
      setShouldDisplayObjects(final)
    }
  }, [filterSort.filterVisible, defaultHideHighlights, all, filterSort.searchInput, sortMode, showHiddenMetasInObjectPanel, showHidden])

  const debounceSet = useDebounceFn(
    v => {
      setFilterSort(s => ({ ...s, searchInput: v }))
    },
    { wait: 300 }
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
          background: canDropAsMeta.droppable ? Colors.Common.SelectColor : undefined
        }}
      ></div>
      <Content
        flex
        column
        gap={6}
        style={{
          padding: '10px 10px 8px'
        }}
      >
        {filterSort.searchVisible && (
          <Content
            flex
            className={'focus-within-input border-box-shadow'}
            alignItems="center"
            gap={5}
            style={{
              fontSize: '13px',
              padding: '2px 6px',
              borderRadius: 4
            }}
          >
            <input
              autoFocus={true}
              spellCheck={'false'}
              style={{
                flex: 1,
                borderRadius: 4
              }}
              onChange={e => {
                debounceSet.run(e.target.value)
              }}
              placeholder={t('general.Type to search') + '...'}
              defaultValue={filterSort.searchInput}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  setFilterSort(s => ({ ...s, searchInput: e.target.value }))
                }
                if (isHotkey(KEY.Escape, e)) {
                  setFilterSort(s => ({ ...s, searchVisible: false }))
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
              className={'transparent-font'}
              onClick={() =>
                setFilterSort(s => ({
                  ...s,
                  searchInput: '',
                  searchVisible: false
                }))
              }
            />
          </Content>
        )}
        <Content flex gap={6} className={'font-size-14'} alignItems={'center'}>
          <Content flex alignItems={'center'} gap={8} style={{ marginRight: 'auto' }} className={'transparent-font'}>
            <Icon name={'custom-card-library'} />
            <span className={'font-size-12'}>{shouldDisplayObjects.length}</span>
          </Content>
          {renderContains()}
          <div
            style={{
              width: 1,
              height: 16,
              background: Colors.Background.Border
            }}
          ></div>
          <IconWithPopover
            size={14}
            className={ClassName.flatButton(4, '3px')}
            name={'park-sort-two'}
            placement={['bottom']}
            content={setV => (
              <WithBorder padding={'0.4rem 0'}>
                <Menu.NavigationMenu
                  layout={[
                    {
                      type: 'title',
                      name: t('general.Sort by')
                    },
                    {
                      type: 'item',
                      key: 'create',
                      text: t('general.recentlyCreated'),
                      onSelect: () => {
                        setV(false)
                        setSidebarDatabaseState(s => ({
                          ...s,
                          sort: 'create'
                        }))
                      }
                    },
                    {
                      type: 'item',
                      key: 'recent',
                      text: t('general.recentlyViewed'),
                      onSelect: () => {
                        setV(false)
                        setSidebarDatabaseState(s => ({ ...s, sort: 'view' }))
                      }
                    }
                  ]}
                />
              </WithBorder>
            )}
          />
          <Icon
            className={ClassName.flatButton(4, '3px')}
            style={{
              color: filterSort.searchInput || filterSort.searchVisible ? Colors.Common.SelectColor : undefined
            }}
            onClick={() => setFilterSort(s => ({ ...s, searchVisible: !s.searchVisible }))}
            name="park-search"
          />
          <AnimatePopover
            padding={6}
            align="start"
            reposition
            withClickCover={true}
            onVisiblityChange={v => setFilterSort(s => ({ ...s, filterVisible: v }))}
            positions={['bottom']}
            disableNudge
            content={
              <WithBorder padding={8}>
                <BetterFilter
                  showHiddenMetas={showHiddenMetasInObjectPanel}
                  onChange={v => {
                    setFilterSort(s => ({ ...s, filter: v }))
                  }}
                  root={filterSort.filter}
                />
              </WithBorder>
            }
          >
            <Icon
              className={ClassName.flatButton(4, '3px')}
              style={{
                width: 'fit-content',
                color: filterSort.filter?.rules.length ? Colors.Common.SelectColor : undefined
              }}
              name="park-filter"
            />
          </AnimatePopover>
          <div
            style={{
              width: 1,
              height: 16,
              background: Colors.Background.Border
            }}
          ></div>
          <Icon
            name={filterSort.viewMode === 'title' ? 'custom-list' : 'park-all-application'}
            onClick={() => setSidebarDatabaseState(s => ({ ...s, viewMode: s.viewMode === 'title' ? 'thumbnail' : 'title' }))}
            className={ClassName.flatButton(4, '3px')}
          />
          {!contains?.length ? (
            <Tooltip delay={200} content={t('general.Show hidden objects')}>
              <Icon
                onClick={() => {
                  KeyvalueStore.updateOne('showHiddenMetasInSidebar', !showHiddenMetasInObjectPanel)
                }}
                className={ClassName.flatButton(4, '3px')}
                name={showHiddenMetasInObjectPanel ? 'park-preview-open' : 'park-preview-close'}
              />
            </Tooltip>
          ) : null}
        </Content>
        {renderContainIndicator()}
      </Content>
      {filterSort.viewMode === 'title' && <TitleList items={shouldDisplayObjects} />}
      {filterSort.viewMode === 'thumbnail' && <ThumbnailList items={shouldDisplayObjects} />}
    </>
  )
})
const TitleList = ({ items }: { items: MetaObject[] }) => {
  const preview = useGlobalAtomValue(previewSidebarTitleAtom)
  return (
    <VirtualList
      items={items}
      getKey={i => i.id}
      renderItem={item => <SimpleObject preview={preview} mode={'title'} key={item.id} metaObjectId={item.id} />}
      estimateSize={40}
      paddingEnd={200}
      overscan={10}
      style={{
        width: '100%',
        height: '100%',
        padding: '0px 4px'
      }}
    ></VirtualList>
  )
}
const ThumbnailList = ({ items }: { items: MetaObject[] }) => {
  const [measure, { width }] = useMeasure()
  const lanes = Math.floor(width / 460) + 1
  const display = useMemo(() => chunk(items, lanes), [items, lanes])
  return (
    <div ref={measure} style={{ width: '100%', height: '100%' }}>
      <VirtualList
        items={display}
        getKey={i => i[0]?.id}
        itemStyle={{
          display: 'flex'
        }}
        renderItem={itemz => (
          <>
            {itemz.map(item => (
              <SimpleObject mode={'thumbnail'} key={item.id} metaObjectId={item.id} />
            ))}
          </>
        )}
        estimateSize={208}
        paddingEnd={200}
        overscan={10}
        style={{
          width: '100%',
          height: '100%',
          overflowAnchor: 'none'
        }}
      ></VirtualList>
    </div>
  )
}
