import React, { createContext, CSSProperties, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useGlobalAtomValue, useMeasure } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { SidebarDatabaseCache } from '@/api/stores/keyvalue.store'
import { MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { GlobalSetting, SimpleObject } from '@/core'
import { AnimatePopover, BetterInput, CheckBox, Icon, IconWithPopover, Menu, Tooltip, VirtualList, WithBorder } from '@/components'
import isHotkey from 'is-hotkey'
import { KEY, Colors, Icons } from '@/consts'
import BetterFilter from '@/core/object/filter/BetterFilter'
import useDisplayInside from '@/core/object/objectList/useDisplayInside'
import { chunk } from 'lodash'
import classnames from 'classnames'
import trans from '@/consts/trans'

export const defaultFilterSort: SidebarDatabaseCache = {
  filterVisible: false,
  searchInput: '',
  searchVisible: false,
  viewMode: 'title',
  showHidden: false,
  filter: {
    groupType: 'and',
    filterType: 'group',
    rules: []
  }
}
type IObjectListConfig = Partial<{
  listStyle: CSSProperties
  listClassName: string
  listChildrenStyle?: CSSProperties
  listChildrenClassName?: string
  thumbnailMaxWidth?: number
  thumbnailChildrenClassName?: string
  headerClassName?: string
  headerHideViewModeChanger?: boolean
  showLabel: boolean
}>
const ConfigContext = createContext<IObjectListConfig>({})
export default memo(
  ({
    visible,
    defaultFilterSort: outerDefaultFilterSort,
    onFilterSortChange = () => {},
    filterSort: outerFilterSort,
    visibleMetas,
    onSelect,
    selected,
    config = {}
  }: {
    visible: boolean
    onFilterSortChange?: (f: (v: SidebarDatabaseCache) => SidebarDatabaseCache) => void
    filterSort?: Partial<SidebarDatabaseCache>
    onSelect?: (metas: number[]) => void
    visibleMetas?: number[]
    selected?: number[]
    showHidden?: boolean
    config?: IObjectListConfig
    defaultFilterSort?: Partial<SidebarDatabaseCache>
  }) => {
    const undeleteObjects = MetaStore.useUndeleted()
    const [filterSort, setInnerFilterSort] = useState<SidebarDatabaseCache>({
      ...defaultFilterSort,
      ...outerFilterSort,
      ...outerDefaultFilterSort
    })
    const setFilterSort = (f: (v: SidebarDatabaseCache) => SidebarDatabaseCache) => {
      setInnerFilterSort(f)
      onFilterSortChange(f)
    }
    useEffect(() => {
      if (outerFilterSort && outerFilterSort !== filterSort) {
        setInnerFilterSort(outerFilterSort)
      }
    }, [outerFilterSort])
    const handleSelect = onSelect
      ? (v: number) => {
          if (selected?.includes(v)) {
            onSelect(selected.filter(o => o !== v))
          } else {
            onSelect([...(selected || []), v])
          }
        }
      : undefined
    const { renderContains, contains, renderContainIndicator } = useDisplayInside({
      defaultSelected: filterSort.selectedMeta || [],
      onSelect: v => {
        setFilterSort(s => ({ ...s, selectedMeta: v }))
      },
      disable: !visible,
      currentMetas: visibleMetas
    })
    const showLabel = config.showLabel || contains?.length || filterSort.filter?.rules.length || filterSort.searchInput
    const sortMode = filterSort?.sort || 'create'
    const { t } = useTranslation()
    const showHidden = contains?.length || filterSort.showHidden
    const all = useMemo(
      () => contains || (visibleMetas ? visibleMetas.map(i => MetaStore.getCachedMetaObject(i)) : undeleteObjects),
      [contains, visibleMetas, undeleteObjects]
    )
    const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(
      all.filter(i =>
        MetaStore.isVisibleMetaObject(i, {
          showLabel: !!showLabel,
          showHidden: !!showHidden
        })
      )
    )
    useEffect(() => {
      if (filterSort.filterVisible === false && (filterSort.filter?.rules.length || filterSort.searchInput)) {
        const all = contains || Array.from(MetaStore.getMetaObjectsMap().values())
        const action = async () => {
          const afterFilter = (filterSort.filter?.rules.length ? await Global.metaOps.filter(filterSort.filter, all) : all) || all
          const afterSearch = filterSort.searchInput
            ? await Global.metaOps.search(filterSort.searchInput, afterFilter, {
                showHidden: true,
                showLabel: true
              })
            : afterFilter
          const afterSort = Global.metaOps.sort(
            sortMode === 'create' ? 'createdAt' : sortMode === 'view' ? 'viewAt' : 'name',
            sortMode === 'name' ? 'asc' : 'desc',
            afterSearch
          )
          const final = afterSort.filter(i =>
            MetaStore.isVisibleMetaObject(i, {
              showLabel: !!showLabel,
              showHidden: !!showHidden
            })
          )
          setShouldDisplayObjects(final)
        }
        action()
      }
      if (filterSort.filterVisible === false && !filterSort.filter?.rules.length && !filterSort.searchInput) {
        const afterSort = Global.metaOps.sort(
          sortMode === 'create' ? 'createdAt' : sortMode === 'view' ? 'viewAt' : 'name',
          sortMode === 'name' ? 'asc' : 'desc',
          all
        )
        const final = afterSort.filter(i =>
          MetaStore.isVisibleMetaObject(i, {
            showLabel: !!showLabel,
            showHidden: !!showHidden
          })
        )
        setShouldDisplayObjects(final)
      }
    }, [filterSort.filterVisible, all, filterSort.searchInput, sortMode, filterSort.showHidden, showHidden])
    useLayoutEffect(() => {
      if (onSelect) {
        onSelect([])
      }
    }, [shouldDisplayObjects.length])
    const debounceSet = useDebounceFn(
      v => {
        setFilterSort(s => ({ ...s, searchInput: v }))
      },
      { wait: 300 }
    )
    const inputRef = useRef<HTMLInputElement>(null)
    return (
      <ConfigContext.Provider value={config}>
        <div className={classnames('flex flex-col gap-1.5 pr-3 pl-4 py-2', config.headerClassName)}>
          <div className={'items-center flex gap-1.5'}>
            <div className={'transparent-font flex items-center ml-1 mr-auto gap-2'}>
              {onSelect && shouldDisplayObjects.length > 0 && (
                <CheckBox
                  className={'mr-2'}
                  onChange={v => {
                    if (v) {
                      onSelect(shouldDisplayObjects.map(i => i.id))
                    } else {
                      onSelect([])
                    }
                  }}
                  checked={selected?.length === shouldDisplayObjects.length}
                />
              )}
              <Icon name={'custom-card-library'} />
              <span className={'font-size-12'}>
                {selected?.length ? `${selected.length} / ` : undefined}
                {shouldDisplayObjects.length}
              </span>
            </div>
            <div className={'flex items-center'}>
              <Icon
                className={'square-button-small'}
                onClick={() => {
                  setFilterSort(s => ({ ...s, searchVisible: !s.searchVisible }))
                  inputRef.current?.focus()
                }}
                name={Icons.Search}
              />
              <BetterInput
                ref={inputRef}
                defaultValue={filterSort.searchInput}
                placeholder={t(trans.Search)}
                onBlur={() => {
                  if (!filterSort.searchInput) {
                    setFilterSort(s => ({ ...s, searchVisible: false }))
                  }
                }}
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    setFilterSort(s => ({ ...s, searchInput: e.currentTarget.value }))
                  }
                  if (isHotkey(KEY.Escape, e)) {
                    e.currentTarget.blur()
                    setFilterSort(s => ({ ...s, searchVisible: false, searchInput: undefined }))
                  }
                }}
                className={'font-size-13'}
                onChange={e => debounceSet.run(e.target.value)}
                style={{
                  width: filterSort.searchVisible ? 100 : 0,
                  transition: 'all 0.26s ease',
                  opacity: filterSort.searchVisible ? 1 : 0,
                  marginLeft: filterSort.searchVisible ? '0.5rem' : undefined
                }}
              />
            </div>
            <div
              style={{
                width: 1,
                height: 16,
                background: Colors.Background.Border
              }}
            ></div>
            {renderContains()}
            <IconWithPopover
              size={14}
              className={'square-button-small'}
              name={'park-sort-two'}
              placement={['bottom']}
              content={setV => (
                <WithBorder padding={'0.25rem 0 0.4rem'}>
                  <Menu.NavigationMenu
                    defaultSelected={[filterSort.sort || 'create']}
                    layout={[
                      {
                        type: 'title',
                        name: t('general.Sort by')
                      },
                      {
                        type: 'item',
                        key: 'name',
                        text: t(trans.Name),
                        onSelect: () => {
                          setV(false)
                          setFilterSort(s => ({
                            ...s,
                            sort: 'name'
                          }))
                        }
                      },
                      {
                        type: 'item',
                        key: 'create',
                        text: t(trans.RecentlyCreated),
                        onSelect: () => {
                          setV(false)
                          setFilterSort(s => ({
                            ...s,
                            sort: 'create'
                          }))
                        }
                      },
                      {
                        type: 'item',
                        key: 'view',
                        text: t(trans.RecentlyViewed),
                        onSelect: () => {
                          setV(false)
                          setFilterSort(s => ({ ...s, sort: 'view' }))
                        }
                      }
                    ]}
                  />
                </WithBorder>
              )}
            />
            <AnimatePopover
              padding={6}
              align='center'
              reposition
              withClickCover={true}
              onVisiblityChange={v => setFilterSort(s => ({ ...s, filterVisible: v }))}
              positions={['bottom']}
              disableNudge
              containerStyle={{
                zIndex: '5000'
              }}
              content={
                <WithBorder>
                  <BetterFilter
                    currentMetas={visibleMetas}
                    showHiddenMetas={filterSort.showHidden}
                    onChange={v => {
                      setFilterSort(s => ({ ...s, filter: v }))
                    }}
                    root={filterSort.filter}
                  />
                </WithBorder>
              }
            >
              <Icon
                className={classnames('square-button-small', filterSort.filter?.rules.length && 'active-button')}
                style={{
                  width: 'fit-content'
                }}
                name='park-filter'
              />
            </AnimatePopover>
            {config.headerHideViewModeChanger !== true && (
              <>
                <div
                  style={{
                    width: 1,
                    height: 16,
                    background: Colors.Background.Border
                  }}
                ></div>
                <Icon
                  name={filterSort.viewMode === 'title' ? 'custom-list' : 'park-all-application'}
                  onClick={() => setFilterSort(s => ({ ...s, viewMode: s.viewMode === 'title' ? 'thumbnail' : 'title' }))}
                  className={'square-button-small'}
                />
                {!contains?.length ? (
                  <Tooltip delay={200} content={t('general.Show hidden objects')}>
                    <Icon
                      onClick={() => {
                        setFilterSort(s => ({ ...s, showHidden: !s.showHidden }))
                      }}
                      className={'square-button-small'}
                      name={filterSort.showHidden ? 'park-preview-open' : 'park-preview-close'}
                    />
                  </Tooltip>
                ) : null}
              </>
            )}
          </div>
          {renderContainIndicator()}
        </div>
        {shouldDisplayObjects.length === 0 && (
          <div className={'super-transparent-font flex items-center justify-center w-full flex-1 font-size-13'}>{t('general.No data')}</div>
        )}
        {shouldDisplayObjects.length > 0 && (
          <div className={'overflow-hidden w-full flex-1'}>
            {filterSort.viewMode === 'title' && <TitleList items={shouldDisplayObjects} selected={selected} onSelect={handleSelect} />}
            {filterSort.viewMode === 'thumbnail' && (
              <ThumbnailList onSelect={handleSelect} items={shouldDisplayObjects} selected={selected} />
            )}
          </div>
        )}
      </ConfigContext.Provider>
    )
  }
)
const TitleList = ({ items, onSelect, selected }: { items: MetaObject[]; onSelect?: (meta: number) => void; selected?: number[] }) => {
  const config = useContext(ConfigContext)
  const preview = useGlobalAtomValue(GlobalSetting.atoms.previewSidebarTitleAtom)
  const selectedSet = useMemo(() => new Set(selected), [selected])
  return (
    <VirtualList
      items={items}
      getKey={i => i.id}
      renderItem={item => (
        <SimpleObject
          onSelect={onSelect ? () => onSelect?.(item.id) : undefined}
          isSelected={selectedSet.has(item.id)}
          preview={preview}
          mode={'title'}
          key={item.id}
          metaObjectId={item.id}
        />
      )}
      estimateSize={40}
      paddingEnd={50}
      overscan={10}
      childrenContainerClassname={config.listChildrenClassName}
      className={classnames('px-3', config.listClassName)}
      style={{
        width: '100%',
        height: '100%',
        ...config.listStyle
      }}
    ></VirtualList>
  )
}
const ThumbnailList = ({ items, onSelect, selected }: { items: MetaObject[]; onSelect?: (meta: number) => void; selected?: number[] }) => {
  const config = useContext(ConfigContext)
  const ref = useRef<HTMLDivElement>(null)
  const { width } = useMeasure(ref)
  const maxWidth = config.thumbnailMaxWidth ? Math.min(config.thumbnailMaxWidth, width) : width
  const lanes = Math.floor(maxWidth / 460) + 1
  const display = useMemo(() => chunk(items, lanes), [items, lanes])
  const selectedSet = useMemo(() => new Set(selected), [selected])
  return (
    <div ref={ref} className={'w-full h-full'}>
      <VirtualList
        items={display}
        getKey={i => i[0]?.id}
        itemStyle={{
          display: 'grid',
          gridTemplateColumns: `repeat(${lanes}, 1fr)`
        }}
        renderItem={itemz => (
          <>
            {itemz.map(item => (
              <SimpleObject
                maxHeight={240}
                onSelect={onSelect ? () => onSelect?.(item.id) : undefined}
                isSelected={selectedSet.has(item.id)}
                mode={'thumbnail'}
                key={item.id}
                metaObjectId={item.id}
              />
            ))}
          </>
        )}
        estimateSize={208}
        paddingEnd={50}
        overscan={5}
        childrenContainerClassname={config.thumbnailChildrenClassName}
        className={classnames('px-2', config.listClassName)}
        style={{
          width: '100%',
          height: '100%',
          overflowAnchor: 'none',
          ...config.listStyle
        }}
      ></VirtualList>
    </div>
  )
}
