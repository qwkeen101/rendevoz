import { AnimatePopover, CheckBox, Content, Icon, WithBorder } from '@/components/base'
import TimePicker from '@/components/base/TimePicker'
import { ObjectTag } from '@/core'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import { indexedMetaObjectsAtom, metaObjectsAtom, tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { ObjectStore, globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { subDays, subMonths, subYears } from 'date-fns'
import produce from 'immer'
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai/react'
import { useEffect, useMemo, useRef } from 'react'
import { MetaObject } from '~/typings/data'
import { TypeToTypeName } from '../card/DatabaseCard'
import {
  CurrentFocusFilterAtom,
  FilterDateIntervalsAtom,
  FilterRelatedIdsAtom,
  FilterSelectedTagsAtom as FilterSelectedTagsMapAtom,
  FilterTypesAtom,
  FilterViewDateIntervalAtom,
  intersectionOfMultipleSets,
  RealFilterRelatedIdsAtom,
  ShouldFilterIdsAtom
} from './useObjectFilter'
import { selectAtom } from 'jotai/utils'
import { useTranslation } from 'react-i18next'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { atom } from 'jotai'
import Colors from '@/consts/colors'

export type FilterType = 'tag' | 'type' | 'createdAt' | 'relatedObjectsSize' | 'addOne' | 'related' | 'viewAt'

const filterContainerClassName = (focused: boolean) =>
  css({
    border: focused ? '1px solid #8590ae' : `1px solid ${Colors.Background.Border}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    borderRadius: 8,
    padding: '4px 8px'
  })
export const FiltersAtom = atom<
  {
    id: number
    filterType: FilterType
    initialOpen: boolean
  }[]
>([])
export const DatabaseFilter = () => {
  const [filters, setFilters] = useAtom(FiltersAtom)
  const [chooseFilterVisible, toggleChooseFilterVisible] = useToggle(false)
  const setCurrentFocusFilter = useSetAtom(CurrentFocusFilterAtom)
  const { t } = useTranslation()
  const addFilter = (type: FilterType) => {
    const id = Id.getId()
    setFilters([...filters, { id, filterType: type, initialOpen: true }])
    toggleChooseFilterVisible(false)
    if (type === 'related') {
      setCurrentFocusFilter({
        id: id,
        type: 'related'
      })
    }
  }
  return (
    <Content flex gap={10} style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
      {filters.map(i => (
        <Filter
          id={i.id}
          onClose={() => {
            const idx = filters.findIndex(o => o === i)
            filters.splice(idx, 1)
            setFilters([...filters])
          }}
          initialOpen={i.initialOpen}
          filterType={i.filterType}
          key={i.id}
        ></Filter>
      ))}
      <AnimatePopover
        align="start"
        visible={chooseFilterVisible}
        positions={['bottom']}
        onClickOutside={toggleChooseFilterVisible}
        containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
        content={
          <WithBorder style={{ padding: 6, width: 200, fontFamily: 'Muli' }} className={css({ '> div': { textTransform: 'capitalize' } })}>
            <div style={{ marginLeft: 10 }} className={ClassName.description()}>
              {t('dialog.choose one filter', { choose: t('general.choose'), one: t('general.one'), filter: t('general.filter') })}
            </div>
            {!filters.some(i => i.filterType === 'createdAt') && (
              <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('createdAt')}>
                <Icon name="park-time" />
                {t('general.create time')}
              </Content>
            )}
            {!filters.some(i => i.filterType === 'viewAt') && (
              <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('viewAt')}>
                <Icon name="park-preview-open" />
                {t('general.view time')}
              </Content>
            )}
            <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('tag')}>
              <Icon name="park-tag-one" />
              {t('general.tags')}
            </Content>
            {!filters.some(i => i.filterType === 'type') && (
              <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('type')}>
                <Icon name="park-info" />
                {t('general.type')}
              </Content>
            )}
            <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('related')}>
              <Icon name="park-share-one" />
              {t('general.related objects')}
            </Content>
          </WithBorder>
        }
      >
        <Content
          flex
          gap={6}
          alignItems="center"
          className={ClassName.flatButton()}
          style={{
            borderRadius: 8,
            padding: '4px 12px',
            border: `1px solid ${Colors.Background.Border}`,
            fontFamily: 'Muli',
            textTransform: 'capitalize'
          }}
          onClick={toggleChooseFilterVisible}
        >
          {`${t('general.add')} ${t('general.filter')}`}
          <Icon name="park-plus" />
        </Content>
      </AnimatePopover>
    </Content>
  )
}

const Filter = ({
  filterType,
  onClose,
  id,
  initialOpen
}: {
  filterType: FilterType
  onClose: VoidFunction
  id: number
  initialOpen: boolean
}) => {
  const setFilters = useSetAtom(FiltersAtom)
  useEffect(() => {
    return () => {
      setFilters(filters => {
        const idx = filters.findIndex(i => i.id === id)
        if (filters[idx]) {
          filters[idx].initialOpen = false
        }
        return [...filters]
      })
    }
  }, [])
  const renderContent = () => {
    switch (filterType) {
      case 'tag':
        return <TagFilter filterId={id} onClose={onClose} initialOpen={initialOpen} />
      case 'createdAt':
        return <CreateTimeFilter onClose={onClose} initialOpen={initialOpen} />
      case 'type':
        return <TypeFilter onClose={onClose} initialOpen={initialOpen} />
      case 'related':
        return <RelatedObjectsFilter filterId={id} onClose={onClose} />
      case 'viewAt':
        return <ViewTimeFilter onClose={onClose} initialOpen={initialOpen} />
      default:
        return null
    }
  }

  return renderContent()
}
const TypeFilter = ({ onClose, initialOpen }: { onClose: VoidFunction; initialOpen: boolean }) => {
  const [filterTypes, setFilterTypes] = useAtom(FilterTypesAtom)
  const typeToMetaObjectIdsMap = useGlobalAtomValue(indexedMetaObjectsAtom)?.typeToMetaObjectIdsMap
  const shouldFilterIdSet = useAtomValue(ShouldFilterIdsAtom)
  const [popoverVisible, togglePopoverVisible] = useToggle(initialOpen)
  const { t } = useTranslation()
  const types: MetaObject['type'][] = [
    'normal',
    'note',
    'noteBlock',
    'noteLabel',
    'pdf',
    'pdfLabel',
    'whiteboard',
    'webpage',
    'webpageLabel'
  ]
  const toggleType = (type: typeof types[number]) => {
    if (filterTypes.has(type)) {
      setFilterTypes(
        produce(filterTypes, draft => {
          draft.delete(type)
        })
      )
    } else {
      setFilterTypes(
        produce(filterTypes, draft => {
          draft.add(type)
        })
      )
    }
  }
  const renderPopover = () => {
    return (
      <Content
        flex
        column
        className={css([
          {
            minWidth: 250,
            padding: 12,
            borderRadius: 8,
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            fontFamily: 'Muli',
            textTransform: 'capitalize'
          },
          ClassName.Background.blurBackground
        ])}
      >
        {types.map(type => (
          <Content flex className={ClassName.flatButton()} gap={6} onClick={() => toggleType(type)}>
            <CheckBox checked={filterTypes.has(type)} />
            <Content auto flex justifyContent="space-between">
              <div>{t(`general.${TypeToTypeName[type]}`)}</div>
              <div>
                {shouldFilterIdSet && typeToMetaObjectIdsMap?.has(type)
                  ? intersectionOfMultipleSets(typeToMetaObjectIdsMap.get(type)!, shouldFilterIdSet).size
                  : typeToMetaObjectIdsMap?.get(type)?.size}
              </div>
            </Content>
          </Content>
        ))}
      </Content>
    )
  }

  return (
    <AnimatePopover
      align="start"
      positions={['bottom']}
      visible={popoverVisible}
      onClickOutside={togglePopoverVisible}
      content={renderPopover()}
      containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
    >
      <Content
        flex
        alignItems="center"
        gap={5}
        onClick={togglePopoverVisible}
        className={filterContainerClassName(popoverVisible)}
        style={{
          fontFamily: 'Muli',
          textTransform: 'capitalize'
        }}
      >
        <Icon name="park-info" />
        {Array.from(filterTypes).map(i => (
          <div
            style={{
              fontSize: 13,
              textTransform: 'capitalize'
            }}
            className={ClassName.objectTag}
          >
            {t(`general.${TypeToTypeName[i]}`)}
          </div>
        ))}
        <Icon
          className={ClassName.circleButton()}
          name="park-close"
          onClick={() => {
            setFilterTypes(new Set<any>())
            onClose()
          }}
        />
      </Content>
    </AnimatePopover>
  )
}
const TagFilter = ({ onClose, filterId, initialOpen }: { onClose: VoidFunction; filterId: number; initialOpen: boolean }) => {
  const tagToMetaObjectsMap = useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore })
  const shouldFilterIdSet = useAtomValue(ShouldFilterIdsAtom)
  const allTags = useMemo(() => {
    if (shouldFilterIdSet && tagToMetaObjectsMap) {
      return Array.from(tagToMetaObjectsMap.entries())
        .map(([tag, objectIds]) => {
          if (intersectionOfMultipleSets(objectIds, shouldFilterIdSet).size > 0) {
            return tag
          }
        })
        .filter(i => i) as number[]
    } else {
      return Array.from(tagToMetaObjectsMap?.keys() || [])
    }
  }, [tagToMetaObjectsMap, shouldFilterIdSet])
  const tagAtom = globalStore.get(ObjectStore('tag').objectMapAtom)
  const [filterSelectedTagsMap, setFilterSeletedTagsMap] = useAtom(FilterSelectedTagsMapAtom)
  const [popoverVisible, togglePopoverVisible] = useToggle(initialOpen)
  const toggleTag = (tag: number) => {
    if (filterSelectedTagsMap.get(filterId)?.has(tag)) {
      setFilterSeletedTagsMap(
        produce(filterSelectedTagsMap, draft => {
          draft.get(filterId)?.delete(tag)
        })
      )
    } else {
      setFilterSeletedTagsMap(
        produce(filterSelectedTagsMap, draft => {
          if (filterSelectedTagsMap.has(filterId)) {
            draft.get(filterId)?.add(tag)
          } else {
            draft.set(filterId, new Set([tag]))
          }
        })
      )
    }
  }
  const renderPopover = () => {
    return (
      <Content
        className={css([
          {
            minWidth: 250,
            padding: 12,
            borderRadius: 8,
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            maxHeight: 400,
            overflowY: 'auto'
          },
          ClassName.Background.blurBackground
        ])}
        flex
        column
      >
        {allTags
          .filter(i => tagAtom.has(i))
          .map(i => (
            <Content flex alignItems="center" gap={10} className={ClassName.flatButton()} onClick={() => toggleTag(i)}>
              <CheckBox checked={filterSelectedTagsMap.get(filterId)?.has(i)} />
              <ObjectTag tag={i} hideDelete hideAdd key={i} />
            </Content>
          ))}
      </Content>
    )
  }

  return (
    <AnimatePopover
      onClickOutside={togglePopoverVisible}
      align="start"
      positions={['bottom']}
      content={renderPopover()}
      visible={popoverVisible}
      containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
    >
      <Content flex gap={5} onClick={togglePopoverVisible} className={filterContainerClassName(popoverVisible)}>
        <Icon name="park-tag-one" />
        {Array.from(filterSelectedTagsMap.get(filterId) || []).map(i => (
          <ObjectTag key={i} tag={i} small hideAdd hideDelete hideSize />
        ))}
        <Icon
          className={ClassName.circleButton()}
          name="park-close"
          onClick={() => {
            setFilterSeletedTagsMap(
              produce(filterSelectedTagsMap, draft => {
                draft.delete(filterId)
              })
            )
            onClose()
          }}
        />
      </Content>
    </AnimatePopover>
  )
}

const CreateTimeFilter = ({ onClose, initialOpen }: { onClose: VoidFunction; initialOpen: boolean }) => {
  const databaseStore = useStore()
  const [filterInterval, setFilterInterval] = useAtom(FilterDateIntervalsAtom, { store: databaseStore })
  const [popoverVisible, togglePopoverVisible] = useToggle(initialOpen)

  const renderContent = () => {
    return (
      <Content
        flex
        gap={20}
        className={css([
          {
            width: 700,
            padding: 12,
            borderRadius: 8,
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px'
          },
          ClassName.Background.blurBackground
        ])}
      >
        <Content
          flex
          column
          style={{
            flexShrink: 0,
            justifyContent: 'space-evenly',
            fontFamily: 'Muli',
            borderRight: `1px solid ${Colors.Background.Border}`,
            paddingRight: 10,
            fontSize: 13
          }}
        >
          <div style={{ paddingLeft: 8, fontWeight: 600 }}>Presets</div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subDays(new Date(), 3),
                end: new Date()
              })
            }}
          >
            Last 3 Days
          </div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subDays(new Date(), 7),
                end: new Date()
              })
            }}
          >
            Last Week
          </div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subMonths(new Date(), 1),
                end: new Date()
              })
            }}
          >
            Last Month
          </div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subYears(new Date(), 1),
                end: new Date()
              })
            }}
          >
            Last Year
          </div>
        </Content>
        <Content>
          <div className={ClassName.description()}>
            From {filterInterval.start && DateFormat.format(filterInterval.start, DateFormat.Formats.default)}
          </div>
          <TimePicker
            maxDate={filterInterval.end || new Date()}
            value={filterInterval.start as Date | undefined}
            onChange={v =>
              setFilterInterval({
                ...filterInterval,
                start: v
              })
            }
          />
        </Content>
        <Content>
          <div className={ClassName.description()}>
            To {filterInterval.end && DateFormat.format(filterInterval.end, DateFormat.Formats.default)}
          </div>
          <TimePicker
            maxDate={new Date()}
            minDate={filterInterval.start as Date | undefined}
            value={filterInterval.end as Date | undefined}
            onChange={v =>
              setFilterInterval({
                ...filterInterval,
                end: v
              })
            }
          />
        </Content>
      </Content>
    )
  }
  return (
    <AnimatePopover
      onClickOutside={togglePopoverVisible}
      visible={popoverVisible}
      content={renderContent()}
      positions={['bottom']}
      align="start"
      containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
    >
      <Content alignItems="center" gap={4} flex onClick={togglePopoverVisible} className={filterContainerClassName(popoverVisible)}>
        <Icon name="park-time" size={16} fill="grey" />
        <Content flex gap={6} style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Muli' }}>
          <div>{filterInterval.start && DateFormat.format(filterInterval.start, DateFormat.Formats.default)}</div>
          <div>{'-'}</div>
          <div>{filterInterval.end && DateFormat.format(filterInterval.end, DateFormat.Formats.default)}</div>
        </Content>
        <Icon
          name="park-close"
          className={ClassName.circleButton()}
          onClick={() => {
            onClose()
            setFilterInterval({})
          }}
        />
      </Content>
    </AnimatePopover>
  )
}
const ViewTimeFilter = ({ onClose, initialOpen }: { onClose: VoidFunction; initialOpen: boolean }) => {
  const databaseStore = useStore()
  const [filterInterval, setFilterInterval] = useAtom(FilterViewDateIntervalAtom, { store: databaseStore })
  const [popoverVisible, togglePopoverVisible] = useToggle(initialOpen)

  const renderContent = () => {
    return (
      <Content
        flex
        gap={20}
        className={css([
          {
            width: 700,
            padding: 12,
            borderRadius: 8,
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px'
          },
          ClassName.Background.blurBackground
        ])}
      >
        <Content
          flex
          column
          style={{
            flexShrink: 0,
            justifyContent: 'space-evenly',
            fontFamily: 'Muli',
            borderRight: `1px solid ${Colors.Background.Border}`,
            paddingRight: 10,
            fontSize: 13
          }}
        >
          <div style={{ paddingLeft: 8, fontWeight: 600 }}>Presets</div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subDays(new Date(), 3),
                end: new Date()
              })
            }}
          >
            Last 3 Days
          </div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subDays(new Date(), 7),
                end: new Date()
              })
            }}
          >
            Last Week
          </div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subMonths(new Date(), 1),
                end: new Date()
              })
            }}
          >
            Last Month
          </div>
          <div
            className={ClassName.flatButton()}
            onClick={() => {
              setFilterInterval({
                start: subYears(new Date(), 1),
                end: new Date()
              })
            }}
          >
            Last Year
          </div>
        </Content>
        <Content>
          <div className={ClassName.description()}>
            From {filterInterval.start && DateFormat.format(filterInterval.start, DateFormat.Formats.default)}
          </div>
          <TimePicker
            maxDate={filterInterval.end || new Date()}
            value={filterInterval.start as Date | undefined}
            onChange={v =>
              setFilterInterval({
                ...filterInterval,
                start: v
              })
            }
          />
        </Content>
        <Content>
          <div className={ClassName.description()}>
            To {filterInterval.end && DateFormat.format(filterInterval.end, DateFormat.Formats.default)}
          </div>
          <TimePicker
            maxDate={new Date()}
            minDate={filterInterval.start as Date | undefined}
            value={filterInterval.end as Date | undefined}
            onChange={v =>
              setFilterInterval({
                ...filterInterval,
                end: v
              })
            }
          />
        </Content>
      </Content>
    )
  }
  return (
    <AnimatePopover
      onClickOutside={togglePopoverVisible}
      visible={popoverVisible}
      content={renderContent()}
      positions={['bottom']}
      align="start"
      containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
    >
      <Content alignItems="center" gap={4} flex onClick={togglePopoverVisible} className={filterContainerClassName(popoverVisible)}>
        <Icon name="park-preview-open" size={16} fill="grey" />
        <Content flex gap={6} style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Muli' }}>
          <div>{filterInterval.start && DateFormat.format(filterInterval.start, DateFormat.Formats.default)}</div>
          <div>{'-'}</div>
          <div>{filterInterval.end && DateFormat.format(filterInterval.end, DateFormat.Formats.default)}</div>
        </Content>
        <Icon
          name="park-close"
          className={ClassName.circleButton()}
          onClick={() => {
            onClose()
            setFilterInterval({})
          }}
        />
      </Content>
    </AnimatePopover>
  )
}
const RelatedObjectsFilter = ({ filterId, onClose }: { filterId: number; onClose: VoidFunction }) => {
  const setCurrentFocusFilter = useSetAtom(CurrentFocusFilterAtom)
  const currentSelectIdsAtom = useMemo(() => selectAtom(FilterRelatedIdsAtom, f => f.get(filterId)), [filterId])
  const currentSelectIds = useAtomValue(currentSelectIdsAtom)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentFocusFilter = useAtomValue(CurrentFocusFilterAtom)
  const focused = filterId === currentFocusFilter?.id
  const setRealRelatedIds = useSetAtom(RealFilterRelatedIdsAtom)

  const currentSelectObjects = useMemo(() => {
    if (currentSelectIds) {
      const allObjects = globalStore.get(metaObjectsAtom)
      const selectedObjects = Array.from(currentSelectIds).map(id => allObjects.get(id))
      return selectedObjects
    } else {
      return []
    }
  }, [currentSelectIds]) as MetaObject[]

  return (
    <Content
      ref={containerRef}
      role="data-database-filter"
      flex
      alignItems="center"
      gap={4}
      className={filterContainerClassName(focused)}
      onClick={() => setCurrentFocusFilter({ id: filterId, type: 'related' })}
    >
      <Icon name="park-share-one" />
      <Content flex alignItems="center" gap={4} style={{ flexWrap: 'wrap' }}>
        {currentSelectObjects.map(i => (
          <div key={i.id} className={css([ClassName.ellipsisFont(1), ClassName.objectTag])} style={{ fontSize: 12, maxWidth: '100px' }}>
            {i.name}
          </div>
        ))}
        {focused && (
          <Icon
            className={ClassName.circleButton(4)}
            name="park-check"
            onClick={e => {
              e.stopPropagation()
              if (focused) {
                setCurrentFocusFilter(undefined)
              }
              if (currentSelectIds) {
                setRealRelatedIds(m =>
                  produce(m, draft => {
                    draft.set(filterId, currentSelectIds)
                  })
                )
              }
            }}
          />
        )}
        <Icon
          className={ClassName.circleButton(4)}
          name="park-close"
          onClick={e => {
            e.stopPropagation()
            if (focused) {
              setCurrentFocusFilter(undefined)
            }
            setRealRelatedIds(m =>
              produce(m, draft => {
                draft.delete(filterId)
              })
            )
            onClose?.()
          }}
        />
      </Content>
    </Content>
  )
}
export * from './useObjectFilter'
