import React, { memo, useEffect, useRef, useState } from 'react'
import { useDebounceFn, useGlobalAtomValue } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/api/stores/meta/meta.store'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import { go } from 'fuzzysort'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { SimpleObject, useDropObjectArea } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import Colors from '../../consts/colors'
import { AnimatePopover, Button, Content, Icon, Tooltip, VirtualList, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import Select from '@/components/base/select'
import BetterFilter from '@/core/object/filter/BetterFilter'
type ObjectPanelProps = {
  onClose?: VoidFunction
  isAddingObject: boolean
  handleAddObject: (id: number) => void
  padding?: number | string
}
export default memo(({ isAddingObject, handleAddObject, padding = 16 }: ObjectPanelProps) => {
  const undeleteObjects = useGlobalAtomValue(undeletedMetaObjectsAtom)
  const filterSort = KeyvalueStore.useValue('sidebarDatabaseCache') || {
    filterVisible: false,
    searchInput: '',
    searchVisible: false,
    filter: {
      groupType: 'and',
      filterType: 'group',
      rules: []
    }
  }
  const setFilterSort = (updater: any) => KeyvalueStore.updateOne('sidebarDatabaseCache', updater(filterSort))
  const sortMode = filterSort?.sort || 'create'
  const { t } = useTranslation()

  const showHiddenMetasInObjectPanel = KeyvalueStore.useValue('showHiddenMetasInSidebar') ?? false
  const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(
    showHiddenMetasInObjectPanel ? undeleteObjects : undeleteObjects.filter(i => MetaStore.isVisibleMetaObject(i))
  )
  useEffect(() => {
    if (filterSort.filterVisible === false && (filterSort.filter?.rules.length || filterSort.searchInput)) {
      const afterFilter =
        (filterSort.filter?.rules.length
          ? calculateFilterObjects(filterSort.filter, undefined, showHiddenMetasInObjectPanel)
          : undeleteObjects) || undeleteObjects
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
      setShouldDisplayObjects(showHiddenMetasInObjectPanel ? afterSort : afterSort.filter(i => MetaStore.isVisibleMetaObject(i)))
    }
    if (filterSort.filterVisible === false && !filterSort.filter?.rules.length && !filterSort.searchInput) {
      const afterSort = calculateSortObjects(undeleteObjects, {
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
      setShouldDisplayObjects(showHiddenMetasInObjectPanel ? afterSort : afterSort.filter(i => MetaStore.isVisibleMetaObject(i)))
    }
  }, [filterSort.filterVisible, undeleteObjects, filterSort.searchInput, sortMode, showHiddenMetasInObjectPanel])

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
          background: !canDropAsMeta.droppable ? Colors.Common.Red : Colors.Common.SelectColor
        }}
      ></div>
      <Content
        flex
        column
        gap={6}
        style={{
          padding
        }}
      >
        <Content style={{ paddingLeft: 6 }} flex alignItems={'center'} justifyContent={'space-between'} className={ClassName.title('1rem')}>
          {t('general.object library')}
          <span className={'super-transparent-font font-size-12 slim-font'}>{`${t('general.total objects')}: ${
            shouldDisplayObjects.length
          }`}</span>
        </Content>
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
              onClick={() => setFilterSort(s => ({ ...s, searchInput: '', searchVisible: false }))}
            />
          </Content>
        )}
        <Content flex gap={6} alignItems={'center'}>
          <Select
            value={sortMode}
            style={{
              fontSize: 12,
              padding: '2px 6px',
              height: 'auto'
            }}
            closeOnSelect={true}
            align={'start'}
            onSelect={v => KeyvalueStore.updateOne('sidebarDatabaseCache', { ...filterSort, sort: v[0] })}
            options={[
              {
                value: 'create',
                children: t('general.recentlyCreated')
              },
              {
                value: 'recent',
                children: t('general.recentlyViewed')
              }
            ]}
          />
          <Button.IconButton
            gap={6}
            style={{
              fontSize: 12,
              padding: '4px',
              marginLeft: 'auto',
              lineHeight: '14px'
            }}
            onClick={() => setFilterSort(s => ({ ...s, searchVisible: !s.searchVisible }))}
            icon="park-search"
          />
          <AnimatePopover
            padding={6}
            align="start"
            reposition
            withClickCover={true}
            onVisiblityChange={v => [setFilterSort(s => ({ ...s, filterVisible: v }))]}
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
            <Button.IconButton
              gap={6}
              style={{
                fontSize: 12,
                padding: '4px',
                lineHeight: '14px',
                width: 'fit-content',
                color: filterSort.filter?.rules.length ? Colors.Common.SelectColor : undefined
              }}
              icon="park-filter"
            />
          </AnimatePopover>
          <Tooltip delay={200} content={t('general.Show hidden objects')}>
            <Icon
              onClick={() => {
                KeyvalueStore.updateOne('showHiddenMetasInSidebar', !showHiddenMetasInObjectPanel)
              }}
              style={{
                fontSize: 12,
                padding: '4px',
                lineHeight: '14px'
              }}
              className={ClassName.flatButton()}
              name={showHiddenMetasInObjectPanel ? 'park-preview-open' : 'park-preview-close'}
            />
          </Tooltip>
        </Content>
      </Content>
      <VirtualList
        items={shouldDisplayObjects}
        renderItem={item => <SimpleObject metaObjectId={item.id} isAddingObject={isAddingObject} onAddObject={handleAddObject} />}
        estimateSize={40}
        paddingEnd={200}
        style={{
          width: '100%',
          height: '100%',
          padding: '0px 2px 0px 6px'
        }}
      ></VirtualList>
    </>
  )
})
