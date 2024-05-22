import { AnimatePopover, Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { MetaStore } from '@/api/stores'
import { MetaGroup } from '~/typings'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { memo, useLayoutEffect, useRef, useState } from 'react'
import { ClassName } from 'rendevoz'
import { GlobalInstance, useDebounceFn, useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import GroupSettingMenu from '@/core/components/group/components/menu/setting/GroupSettingMenu'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import useGroupQueryLibrary from '@/core/components/group/components/queryLibrary/useGroupQueryLibrary'
import { assignProperties } from '@/utils'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import BetterSorter from '@/core/object/filter/BetterSorter'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { useTranslation } from 'react-i18next'
import { Reorder } from 'framer-motion'
import { isEqual } from 'lodash'
import { useMeasure } from 'react-use'
import useDisplayInside from '@/core/object/objectList/useDisplayInside'
const GroupActions = memo(({ groupValue }: { groupValue?: MetaGroup }) => {
  const groupData = groupValue
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const [innerFilter, setInnerFilter] = useState(currentView?.filter)
  const [innerSort, setInnerSort] = useState(currentView?.sort)
  const { renderPanel, open } = useGroupQueryLibrary(groupValue)
  const layout = useSelectAtomValue(GroupStateAtom, s => s.layout)
  const { renderContains, renderContainIndicator } = useDisplayInside({
    defaultSelected: currentView?.selectedContainsMeta,
    onSelect: v => instance.updateCurrentView?.(w => ({ ...w, selectedContainsMeta: v }))
  })
  const instance = useGroupInstance()
  assignProperties(instance, {
    openFilterPanel: () => open()
  })
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
    showCreate
  } = useSelectAtomValue(
    GroupStateAtom,
    s => ({
      paddingTop: s.styles?.actionPaddingTop,
      visibleProps: s.visibleProperties,
      visibleTypes: s.visibleTypes,
      showViews: s.layout?.showMultipleViews,
      showImport: s.layout?.showImport,
      showCreate: s.layout?.showCreate
    }),
    {
      compare: (prev, curr) => isEqual(prev, curr)
    }
  )

  const [showSearch, setShowSearch] = useState(!!search)
  const isCompo = useRef(false)
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
    if (groupValue?.views) {
      setInnerViews(groupValue.views)
    }
  }, [groupValue?.views])
  const [ref, { width }] = useMeasure()
  const columnLayout = width > 0 && width < 400
  if (!groupData) return null

  return (
    <>
      <Content
        ref={ref}
        flex
        column={columnLayout}
        gap={10}
        role={'group-action-container'}
        style={{
          padding: `${paddingTop}px var(--page-padding-right) 8px var(--page-padding-left)`,
          position: 'sticky',
          left: 0,
          fontWeight: 600,
          fontSize: 13
        }}
      >
        {renderPanel()}
        {showViews !== false && (
          <Content flex>
            <Reorder.Group
              ref={reorderRef}
              values={innerViews}
              onReorder={v => {
                setInnerViews(v)
              }}
              layoutScroll={true}
              as={'div'}
              axis={'x'}
              style={{ overflowX: 'auto', marginRight: 4, display: 'flex', gap: 4 }}
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
                    className={ClassName.flatButton()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: i.id === currentView?.id ? Colors.Font.Primary : Colors.Font.Transparent,
                      background: i.id === currentView?.id ? Colors.Background.ButtonHover : undefined,
                      flexShrink: 0
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
                <WithBorder padding={4} width={180}>
                  <div
                    className={'transparent-font font-size-13'}
                    style={{
                      padding: '4px 8px'
                    }}
                  >
                    {t('group.Create new view')}
                  </div>
                  <Button.IconButton
                    text={t('general.Table')}
                    icon={'park-table-file'}
                    onClick={() => {
                      instance.viewOps?.addNewView('table')
                      setV(false)
                    }}
                  />
                  <Button.IconButton
                    text={t('general.Gallery')}
                    icon={'park-all-application'}
                    onClick={() => {
                      instance.viewOps?.addNewView('gallery')
                      setV(false)
                    }}
                  />
                  <Button.IconButton
                    text={t('general.List')}
                    icon={'custom-list'}
                    onClick={() => {
                      instance.viewOps?.addNewView('list')
                      setV(false)
                    }}
                  />
                  <Button.IconButton
                    text={t('general.Kanban')}
                    icon={'custom-kanban'}
                    onClick={() => {
                      instance.viewOps?.addNewView('kanban')
                      setV(false)
                    }}
                  />
                  <Button.IconButton
                    text={t('general.Calendar')}
                    icon={'park-calendar-three'}
                    onClick={() => {
                      instance.viewOps?.addNewView('calendar')
                      setV(false)
                    }}
                  />
                </WithBorder>
              )}
              name={'park-plus'}
              className={ClassName.flatButton(4, '6px')}
              style={{
                color: Colors.Font.Transparent
              }}
              size={14}
            />
          </Content>
        )}
        <Content flex alignItems="center" style={{ flexShrink: 0, marginLeft: columnLayout ? undefined : 'auto' }}>
          {layout?.showContains &&
            renderContains({
              size: 16,
              style: {
                padding: '3px 8px',
                height: 26,
                marginRight: 4
              }
            })}
          <AnimatePopover
            positions={['bottom']}
            align="end"
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
                  visibleFields={visibleProps.map(i => (i.type === 'custom' ? MetaStore.getPropDetails(i.id)?.name ?? '' : i.name))}
                  extraFields={
                    allHeaders
                      ?.filter(i => i.type === 'custom')
                      .map(i => MetaStore.getPropDetails(i.id))
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
            <Button.IconButton
              style={{
                color: existedFilterLength ? Colors.Common.SelectColor : undefined,
                height: 26,
                marginRight: 4
              }}
              icon="park-filter"
              text={t('general.Filter')}
            />
          </AnimatePopover>
          {currentView?.type !== 'calendar' && (
            <AnimatePopover
              positions={['bottom']}
              align="end"
              padding={8}
              onVisiblityChange={v => {
                if (v === false) {
                  instance.updateCurrentView?.(s => ({ ...s, sort: innerSort }))
                }
              }}
              withClickCover={true}
              content={
                <WithBorder padding={8} width={200}>
                  <BetterSorter root={currentView?.sort} onChange={v => setInnerSort(v)} />
                </WithBorder>
              }
            >
              <Button.IconButton
                style={{
                  color: existedSortLength ? Colors.Common.SelectColor : undefined,
                  height: 26,
                  marginRight: 4
                }}
                icon="park-sort-one"
                text={t('general.Sort')}
              />
            </AnimatePopover>
          )}

          <Icon
            name={'park-search'}
            size={16}
            className={ClassName.circleButton(5, 4)}
            onClick={e => {
              setShowSearch(true)
              e.currentTarget.nextElementSibling?.focus?.()
            }}
          />
          <input
            className={ClassName.noStyleInput}
            defaultValue={search}
            onChange={e => {
              if (!isCompo.current) {
                debounceSet.run(e.target.value)
              }
            }}
            ref={searchInputRef}
            onBlur={e => {
              if (e.currentTarget.value === '') {
                setShowSearch(false)
                setSearch('')
                e.currentTarget.value = ''
              }
            }}
            placeholder={'Search in group...'}
            onCompositionStart={() => (isCompo.current = true)}
            onCompositionEnd={e => {
              isCompo.current = false
              setSearch(e.currentTarget.value)
            }}
            style={{ width: showSearch ? 150 : 0, transition: 'width 0.3s ease', padding: 0, marginRight: 4 }}
          />
          <IconWithPopover
            size={16}
            renderOnParent={false}
            align={'end'}
            name="park-more"
            className={ClassName.circleButton(5, 4)}
            placement={['bottom']}
            content={setV => (
              <WithBorder width={240}>
                <GroupSettingMenu onClose={() => setV(false)} />
              </WithBorder>
            )}
          />
          {groupData.enableReview && (
            <Button.IconButton
              text={t('general.Flashcards')}
              onClick={() => {
                instance.reviewOps?.open()
              }}
              className={ClassName.selectButton()}
              style={{
                marginLeft: 8,
                padding: '2px 8px'
              }}
            />
          )}
          {showImport !== false && (
            <Button.IconButton
              text={t('general.Add')}
              onClick={() => {
                open()
              }}
              className={ClassName.selectButton()}
              style={{
                marginLeft: 8,
                padding: '2px 8px'
              }}
            ></Button.IconButton>
          )}
          {showCreate && (
            <Button.IconButton
              text={t('general.New')}
              onClick={() => {
                GlobalInstance.metaOps?.createObject()
              }}
              className={ClassName.selectButton()}
              style={{
                marginLeft: 8,
                padding: '2px 8px'
              }}
            ></Button.IconButton>
          )}
        </Content>
      </Content>
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
