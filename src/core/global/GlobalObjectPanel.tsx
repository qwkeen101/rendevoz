import { useGlobalAtomValue, useMergedRef, useDebounceFn } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/api/stores/meta/meta.store'
import { MetaStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtom } from 'jotai/react'
import React, { forwardRef, memo, useEffect, useRef, useState } from 'react'
import { MetaFilterGroup, MetaObject } from '~/typings/data'
import { AnimatePopover, Button, Content, Icon, Tooltip, WithBorder, VirtualList, Image } from '@/components'
import { DraggableElement, ObjectActionPopover, useDropObjectArea, useRenderObject } from '@/core'
import { atom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { LeftTopPosition } from '~/typings'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import { Rendevoz } from '../rendevoz'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { calculateSortObjects, SorterGroup } from '@/core/object/filter/BetterSorter'
import { go } from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import Select from '@/components/base/select'
import KeyvalueStore from '@/api/stores/keyvalue.store'

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

    const showHiddenMetasInObjectPanel = KeyvalueStore.useValue('showHiddenMetasInSidebar') ?? false
    const [sortMode, setSortMode] = useState<'create' | 'recent'>('create')
    const [shouldDisplayObjects, setShouldDisplayObjects] = useState<MetaObject[]>(
      showHiddenMetasInObjectPanel ? undeleteObjects : undeleteObjects.filter(i => MetaStore.isVisibleMetaObject(i))
    )
    useEffect(() => {
      if (
        filterSort.filterVisible === false &&
        (filterSort.filter?.rules.length || filterSort.sorter?.sorters.length || filterSort.searchInput)
      ) {
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
          <Content
            flex
            justifyContent="space-between"
            className="global-drag-panel"
            style={{
              paddingLeft: 6
            }}
          >
            <div style={{ marginRight: 'auto' }} className={ClassName.title('1rem')}>
              {t('general.object library')}
              <span className={ClassName.description(FontSize['12px'])} style={{ marginLeft: 16 }}>{`${t('general.total objects')}: ${
                shouldDisplayObjects.length
              }`}</span>
            </div>
            {visiblility.showClose && <Icon name="park-close" className={ClassName.circleButton()} onClick={onClose} />}
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
              onSelect={v => setSortMode(v[0])}
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
                  lineHeight: '14px'
                }}
                icon="park-filter"
                suffixStr={filterSort.filter?.rules.length || undefined}
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
  }
)

export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        onNavigate
      }: {
        metaObjectId: number
        descriptionClassName?: string
        onNavigate?: VoidFunction
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const mergedRef = useMergedRef(containerRef, ref)
      const { renderOptions, metaObject } = useRenderObject({
        metaObjectId: metaObjectId
      })
      const [popoveropen, setpopoveropen] = useState(false)
      if (!metaObject) return null
      return (
        <DraggableElement
          dragHandleClassName={titleClassName}
          ref={mergedRef}
          draggingDetails={{
            type: 'metaElement',
            metaId: metaObjectId
          }}
        >
          <Content
            onClick={e => {
              if (!e.defaultPrevented) {
                Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
              }
            }}
            fullWidth
            flex
            alignItems={'center'}
            gap={10}
            onContextMenu={() => setpopoveropen(true)}
            className={css([
              ClassName.flatButton(6, '6px'),
              {
                height: 32,
                '[role="icon"]': {
                  ':not([data-active="true"])': {
                    opacity: 0,
                    width: 0
                  }
                },
                ':hover': {
                  '[role="icon"]': {
                    opacity: 1,
                    width: 'auto'
                  }
                }
              }
            ])}
          >
            {metaObject.coverImgSrc ? (
              <Image src={metaObject.coverImgSrc} preview width={28} style={{ borderRadius: 6 }} />
            ) : (
              <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.type)} size={16} />
            )}
            <div
              style={{
                fontSize: 12,
                fontWeight: 500
              }}
              className={ClassName.ellipsisFont(1)}
            >
              {metaObject.name || metaObject.placeholderName}
            </div>
            <AnimatePopover
              onClickOutside={() => setpopoveropen(false)}
              visible={popoveropen}
              positions={['right', 'left']}
              align="start"
              padding={0}
              content={
                <WithBorder onClick={e => e.stopPropagation()}>
                  <ObjectActionPopover onClose={() => setpopoveropen(false)} metaObjectId={metaObjectId} />
                </WithBorder>
              }
            >
              <Icon
                onClick={e => {
                  setpopoveropen(true)
                  e.stopPropagation()
                }}
                containerStyle={{
                  zIndex: 10,
                  marginLeft: 'auto'
                }}
                size={20}
                name={'park-more'}
                className={ClassName.flatButton(4, '2px')}
              />
            </AnimatePopover>
          </Content>
        </DraggableElement>
      )
    }
  )
)

const titleClassName = css([ClassName.ellipsisFont(3), ClassName.title(FontSize['14px'])])
