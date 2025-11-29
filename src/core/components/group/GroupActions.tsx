import { AnimatePopover, BetterInput, Button, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { MetaStore } from '@/api/stores'
import { MetaGroup } from '~/typings'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useSelectAtomValue } from '@/hooks'
import { Colors, Icons } from '@/consts'
import GroupSettingMenu from '@/core/components/group/components/menu/setting/GroupSettingMenu'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { noRepeatArray } from '@/utils'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import BetterSorter from '@/core/object/filter/BetterSorter'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { useTranslation } from 'react-i18next'
import { Reorder } from 'framer-motion'
import { isEqual } from 'lodash'
import { useMeasure } from 'react-use'
import useDisplayInside from '@/core/object/objectList/useDisplayInside'
import classnames from 'classnames'
import trans from '@/consts/trans'
import Id from '../../../utils/id'
import toast from 'react-hot-toast'
const GroupActions = memo(({ groupValue }: { groupValue?: MetaGroup }) => {
  const groupData = groupValue
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const [innerFilter, setInnerFilter] = useState(currentView?.filter)
  const [innerSort, setInnerSort] = useState(currentView?.sort)
  const instance = useGroupInstance()
  const search = currentView?.search
  const setSearch = (v: string) => {
    instance.updateCurrentView?.(s => ({ ...s, search: v }))
  }
  const {
    paddingTop = 8,
    visibleTypes,
    visibleProps,
    showImport,
    showViews,
    showCreate,
    onlyCreateType,
    metas,
    showClearAll
  } = useSelectAtomValue(
    GroupStateAtom,
    s => ({
      onlyCreateType: s.state?.onlyCreateType,
      paddingTop: s.styles?.actionPaddingTop,
      visibleProps: s.visibleProperties,
      visibleTypes: s.visibleTypes,
      showViews: s.layout?.showMultipleViews,
      showImport: s.layout?.showImport,
      showCreate: s.layout?.showCreate,
      showClearAll: s.layout?.showClearAll,
      metas: s.data?.values
    }),
    {
      compare: (prev, curr) => isEqual(prev, curr)
    }
  )
  const currentInGroupMetas = useMemo(() => {
    return noRepeatArray(metas?.map(i => i.id) || [])
  }, [metas])
  const { renderContains, renderContainIndicator } = useDisplayInside({
    defaultSelected: currentView?.selectedContainsMeta,
    currentMetas: currentInGroupMetas,
    onSelect: v => instance.updateCurrentView?.(w => ({ ...w, selectedContainsMeta: v }))
  })
  const [showSearch, setShowSearch] = useState(!!search)
  const debounceSet = useDebounceFn(v => setSearch(v), { wait: 500 })
  const existedFilterLength = currentView?.filter?.rules.length ?? 0
  const existedSortLength = currentView?.sort?.sorters.length ?? 0
  const { t } = useTranslation()
  const allHeaders = instance.viewOps?.useViewProperties()
  const [innerViews, setInnerViews] = useState(groupData?.views || [])
  const [isReorder, setIsReorder] = useState(false)
  const reorderRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus()
    } else {
      searchInputRef.current?.blur()
    }
  }, [showSearch])
  useLayoutEffect(() => {
    const ele = searchInputRef.current
    if (ele) {
      ele.value = search || ''
    }
  }, [search])
  useLayoutEffect(() => {
    if (groupValue?.views) {
      setInnerViews(groupValue.views)
    }
  }, [groupValue?.views])
  const [ref, { width }] = useMeasure()
  const columnLayout = width > 0 && width < 400
  if (!groupData) return null

  return (
    <>
      <div
        ref={ref}
        role={'group-action-container'}
        className={classnames('sticky gap-3 left-0 flex font-size-13', columnLayout && 'flex-col')}
        style={{
          padding: `${paddingTop}px var(--page-padding-right) 8px var(--page-padding-left)`
        }}
      >
        {showViews !== false && (
          <div className={'flex'}>
            <Reorder.Group
              ref={reorderRef}
              values={innerViews}
              onReorder={v => {
                setInnerViews(v)
              }}
              layoutScroll={true}
              as={'div'}
              axis={'x'}
              className={'overflow-x-auto no-scrollbar mr-1 flex gap-1.5'}
            >
              {innerViews.map(i => (
                <Reorder.Item
                  dragElastic={false}
                  dragConstraints={isReorder ? reorderRef : undefined}
                  role={'reorder-view'}
                  value={i}
                  as={'div'}
                  key={i.id}
                  transition={{
                    duration: isReorder ? 0.15 : 0
                  }}
                  style={{
                    flexShrink: 0
                  }}
                  onDragStart={() => {
                    setIsReorder(true)
                  }}
                  onDragEnd={() => {
                    setIsReorder(false)
                    instance.updateGroupData?.(w => ({ ...w, views: innerViews }))
                  }}
                >
                  <div
                    className={'button em:h-8 shrink-0 flex items-center gap-2'}
                    style={{
                      color: i.id === currentView?.id ? Colors.Font.Primary : Colors.Font.Transparent,
                      background: i.id === currentView?.id ? Colors.Background.ButtonHover : undefined
                    }}
                    onClick={() => {
                      if (isReorder) return
                      instance.updateGroupData?.(s => ({ ...s, lastViewId: i.id }))
                    }}
                  >
                    {i.icon ? (
                      i.icon.startsWith('park') || i.icon.startsWith('custom') ? (
                        <Icon name={i.icon} />
                      ) : (
                        <EmojiWithPicker emoji={i.icon} style={{ padding: 0 }} />
                      )
                    ) : (
                      <Icon name={'park-table-file'} />
                    )}
                    <div>{i.name || 'Unnamed view'}</div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <IconWithPopover
              placement={['bottom']}
              padding={4}
              content={setV => (
                <WithBorder padding={'0.25rem 0 0.4rem'} width={180}>
                  <Menu.NavigationMenu
                    onSelect={v => {
                      if (v?.type === 'item' && v.key) {
                        instance.viewOps?.addNewView(v.key)
                        setV(false)
                      }
                    }}
                    layout={[
                      {
                        type: 'title',
                        name: t('group.Create new view')
                      },
                      {
                        type: 'item',
                        key: 'table',
                        text: t('general.Table'),
                        icon: 'park-table-file'
                      },
                      {
                        type: 'item',
                        key: 'gallery',
                        text: t('general.Gallery'),
                        icon: 'park-all-application'
                      },
                      {
                        type: 'item',
                        key: 'list',
                        text: t('general.List'),
                        icon: 'custom-list'
                      },
                      {
                        type: 'item',
                        key: 'kanban',
                        text: t('general.Kanban'),
                        icon: 'custom-kanban'
                      },
                      {
                        type: 'item',
                        key: 'calendar',
                        text: t('general.Calendar'),
                        icon: 'park-calendar-three'
                      }
                    ]}
                  />
                </WithBorder>
              )}
              name={'park-plus'}
              className={'button transparent-font em:w-8 em:h-8'}
              size={14}
            />
          </div>
        )}
        <div className={'flex items-center shrink-0 transparent-font'} style={{ marginLeft: columnLayout ? undefined : 'auto' }}>
          {renderContains({
            size: 16,
            className: '!p-1.5 mr-1'
          })}
          <AnimatePopover
            positions={['bottom']}
            padding={8}
            withClickCover={true}
            containerStyle={{
              zIndex: '9996'
            }}
            onVisiblityChange={v => {
              if (v === false) {
                console.log(innerFilter)
                instance.updateCurrentView?.(s => ({ ...s, filter: innerFilter }))
              }
            }}
            content={
              <WithBorder>
                <BetterFilter
                  currentMetas={currentInGroupMetas}
                  visibleFields={visibleProps.map(i =>
                    i.type === 'custom' ? MetaStore.property.getPropDetails(i.id)?.name ?? '' : i.name
                  )}
                  extraFields={
                    allHeaders
                      ?.filter(i => i.type === 'custom')
                      .map(i => MetaStore.property.getPropDetails(i.id))
                      .filter(i => i)
                      .map(i => ({ ...i, value: i.id })) || []
                  }
                  visibleTypes={visibleTypes}
                  root={currentView?.filter}
                  onChange={v => setInnerFilter(v)}
                />
              </WithBorder>
            }
          >
            <Icon
              size={16}
              style={{
                color: existedFilterLength ? Colors.Common.SelectColor : undefined
              }}
              name={Icons.Filter}
              className={'square-button !p-1.5 mr-1'}
              tooltip={t('general.Filter')}
            />
          </AnimatePopover>
          {currentView?.type !== 'calendar' && (
            <AnimatePopover
              positions={['bottom']}
              padding={8}
              onVisiblityChange={v => {
                if (v === false) {
                  instance.updateCurrentView?.(s => ({ ...s, sort: innerSort }))
                }
              }}
              withClickCover={true}
              content={
                <WithBorder padding={8} width={240}>
                  <BetterSorter root={currentView?.sort} onChange={v => setInnerSort(v)} />
                </WithBorder>
              }
            >
              <Icon
                size={16}
                style={{
                  color: existedSortLength ? Colors.Common.SelectColor : undefined
                }}
                className={'!p-1.5 square-button mr-1'}
                name={Icons.Sort}
                tooltip={t('general.Sort')}
              />
            </AnimatePopover>
          )}

          <Icon
            name={Icons.Search}
            size={16}
            className={'square-button !p-1.5'}
            onClick={e => {
              setShowSearch(true)
              e.currentTarget.nextElementSibling?.focus?.()
            }}
          />
          <BetterInput
            defaultValue={search}
            onChange={e => {
              debounceSet.run(e.target.value)
            }}
            ref={searchInputRef}
            onBlur={e => {
              if (e.currentTarget.value === '') {
                setShowSearch(false)
                setSearch('')
                e.currentTarget.value = ''
              }
            }}
            placeholder={t(trans.Search)}
            style={{ width: showSearch || search?.length ? 150 : 0, transition: 'width 0.3s ease', padding: 0, marginRight: 4 }}
          />
          <IconWithPopover
            size={16}
            renderOnParent={false}
            name={Icons.More}
            className={'square-button !p-1.5'}
            placement={['bottom']}
            content={setV => (
              <WithBorder width={260}>
                <GroupSettingMenu onClose={() => setV(false)} />
              </WithBorder>
            )}
          />
          {groupData.enableReview && (
            <Button.IconButton
              size={16}
              icon={'park-degree-hat'}
              text={t('general.Flashcards')}
              onClick={() => {
                instance.reviewOps?.open()
              }}
              className={'ml-1'}
            />
          )}
          {showImport !== false && (
            <Button.IconButton
              size={16}
              text={t('general.Add')}
              icon={Icons.Create}
              onClick={() => {
                const metas = MetaStore.getAll({
                  showHidden: true,
                  showLabel: true,
                  sort: 'createdAtDsc'
                })
                const inGroupMetas = instance.valueOps?.getAllMetasInGroup()
                const inGroupMetaIds = new Set(inGroupMetas?.map(i => i.id))
                const notInGroup = metas.filter(i => !inGroupMetaIds.has(i.id)).map(i => i.id)
                Global.commonOps?.importFromLibrary(notInGroup).then(res => {
                  instance.valueOps?.insertValueByPath(
                    res.map(i => ({
                      id: i.id,
                      type: 'metaObject',
                      rowId: Id.getId()
                    })),
                    groupValue.autoAddto === 'first' ? [0] : undefined
                  )
                  setTimeout(() => toast.success(t(trans.Success.ImportedSuccessfully)), 300)
                })
              }}
              className={'ml-1'}
            ></Button.IconButton>
          )}
          {showCreate && (
            <Button.IconButton
              size={16}
              icon={Icons.Create}
              text={t('general.New')}
              onClick={() => {
                Global.metaOps.createObjects?.(onlyCreateType)
              }}
              className={'ml-1'}
            ></Button.IconButton>
          )}
          {showClearAll && (
            <Button.IconButton
              size={16}
              icon={Icons.Delete}
              text={t('general.Clear')}
              onClick={() => {
                instance.on?.({ type: 'clearAll' })
              }}
              className={'ml-1'}
            ></Button.IconButton>
          )}
        </div>
      </div>
      {renderContainIndicator({
        style: {
          margin: `0px 0px ${currentView?.type === 'gallery' ? '0px' : '10px'}`,
          padding: '0px var(--page-padding-right) 0px var(--page-padding-right)'
        }
      })}
    </>
  )
})

export default GroupActions
