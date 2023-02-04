import { AnimatePopover, CheckBox, Content, Icon, WithBorder } from '@/components/base'
import Select from '@/components/base/select'
import TimePicker from '@/components/base/TimePicker'
import { Tag } from '@/components/form/EditMetaObjectForm'
import { AvaliableGlobalDraggingElements } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { useToggle } from '@/hooks'
import { TagToMetaObjectIdsMapAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { Interval, isWithinInterval, subDays, subMonths, subYears } from 'date-fns'
import produce from 'immer'
import { useAtom, useAtomValue, useStore } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { useEffect, useMemo, useState } from 'react'
import { MetaObject } from '~/typings/data'
import { typeToTypeRecord } from '../card/DatabaseCard'

const FilterSelectedTagsAtom = atom<Set<string>>(new Set<string>())
const FilterDateIntervalsAtom = atom<Partial<Interval>>({})
const FilterTypesAtom = atom<Set<MetaObject['type']>>(new Set<MetaObject['type']>())

type FilterType = 'tag' | 'type' | 'createdAt' | 'relatedObjectsSize' | 'addOne'
const intersectionOfMultipleSets = (...sets: Set<any>[]) => {
  const res = new Set()
  if (sets.length) {
    sets.sort((a, b) => a.size - b.size)
    const smallest = sets.shift()
    for (const val of smallest) {
      if (sets.every(s => s.has(val))) {
        res.add(val)
      }
    }
  }
  return res
}
const DatabaseFilter = ({ onChange }) => {
  const [filters, setFilters] = useState<
    {
      id: number
      filterType: FilterType
    }[]
  >([])
  const databaseStore = useStore()
  const filterTags = useAtomValue(FilterSelectedTagsAtom, { store: databaseStore })
  const filterCreateTimeInterval = useAtomValue(FilterDateIntervalsAtom, { store: databaseStore })
  const filterTypes = useAtomValue(FilterTypesAtom, { store: databaseStore })
  const tagToMetaObjectsMap = useAtomValue(TagToMetaObjectIdsMapAtom, { store: globalStore })
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })
  const [chooseFilterVisible, toggleChooseFilterVisible] = useToggle(false)
  const filterMap = useMemo(() => {
    const map = new Map<string, Set<number>>()
    map.set('tag', new Set())
    map.set('type', new Set())
    map.set('createdAt', new Set())
    return map
  }, [])
  useEffect(() => {
    filterMap.get('type')?.clear()
    const objIdSet = filterMap.get('type')!
    undeletedMetaObjects.forEach(obj => {
      if (filterTypes.has(obj.type)) {
        objIdSet.add(obj.id)
      }
    })
    triggerOnChange()
  }, [filterTypes])
  useEffect(() => {
    filterMap.get('tag')?.clear()
    filterTags.forEach(tag => {
      const objIdSet = tagToMetaObjectsMap.get(tag)
      if (objIdSet) {
        objIdSet.forEach(i => {
          filterMap.get('tag')?.add(i)
        })
      }
    })
    triggerOnChange()
  }, [filterTags])
  useEffect(() => {
    const interval = structuredClone(filterCreateTimeInterval) as Interval
    if (interval.end === undefined) {
      interval.end = new Date()
    }
    if (interval.start === undefined) {
      interval.start = new Date(0)
    }
    if (interval.end < interval.start) return
    filterMap.get('createdAt')?.clear()
    const filteredIds = undeletedMetaObjects.filter(i => isWithinInterval(i.createdAt, interval)).map(i => i.id)
    filterMap.set('createdAt', new Set(filteredIds))
    triggerOnChange()
  }, [filterCreateTimeInterval])
  const triggerOnChange = () => {
    const a = Array.from(filterMap.values())
    const sizeLargerThanZeroSets = a.filter(i => i.size > 0)
    if (sizeLargerThanZeroSets.length === 1 && filters.length === 1) {
      onChange?.(Array.from(sizeLargerThanZeroSets[0]), filters)
      return
    }
    const availableIntersectionSets: Set<any>[] = []
    filterMap.forEach((v, k) => {
      if (filters.some(i => i.filterType === k)) {
        availableIntersectionSets.push(v)
      }
    })
    const intersection = intersectionOfMultipleSets(...availableIntersectionSets) as Set<number>
    console.log(intersection)
    onChange?.(Array.from(intersection), filters)
  }
  const addFilter = (type: FilterType) => {
    setFilters([...filters, { id: Id.getId(), filterType: type }])
    toggleChooseFilterVisible(false)
  }
  return (
    <Content flex gap={10} style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
      {filters.map(i => (
        <Filter
          onClose={() => {
            const idx = filters.findIndex(o => o === i)
            filters.splice(idx, 1)
            setFilters([...filters])
          }}
          filterType={i.filterType}
          key={i.id}
        ></Filter>
      ))}
      {filters.length !== 3 && (
        <AnimatePopover
          align="start"
          visible={chooseFilterVisible}
          positions={['bottom']}
          onClickOutside={toggleChooseFilterVisible}
          content={
            <WithBorder style={{ padding: 6, width: 200, fontFamily: 'Muli' }}>
              <div style={{ marginLeft: 10 }} className={ClassName.description()}>
                Choose One Filter
              </div>
              {!filters.some(i => i.filterType === 'createdAt') && (
                <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('createdAt')}>
                  <Icon name="park-time" />
                  Create Time
                </Content>
              )}
              {!filters.some(i => i.filterType === 'tag') && (
                <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('tag')}>
                  <Icon name="park-tag-one" />
                  Tags
                </Content>
              )}
              {!filters.some(i => i.filterType === 'type') && (
                <Content flex gap={6} className={ClassName.flatButton()} onClick={() => addFilter('type')}>
                  <Icon name="park-info" />
                  Type
                </Content>
              )}
            </WithBorder>
          }
        >
          <Content
            flex
            gap={6}
            alignItems="center"
            className={ClassName.flatButton()}
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              border: '1px solid rgba(0,0,0,0.1)',
              fontFamily: 'Muli'
            }}
            onClick={toggleChooseFilterVisible}
          >
            Add Filter
            <Icon name="park-plus" />
          </Content>
        </AnimatePopover>
      )}
    </Content>
  )
}

const Filter = ({ filterType, onClose }: { filterType: FilterType; onClose: VoidFunction }) => {
  const renderContent = () => {
    switch (filterType) {
      case 'tag':
        return <TagFilter onClose={onClose} />
      case 'createdAt':
        return <CreateTimeFilter onClose={onClose} />
      case 'type':
        return <TypeFilter onClose={onClose} />
      default:
        return null
    }
  }

  return renderContent()
}
const TypeFilter = ({ onClose }: { onClose: VoidFunction }) => {
  const databaseStore = useStore()
  const [filterTypes, setFilterTypes] = useAtom(FilterTypesAtom, { store: databaseStore })
  const [popoverVisible, togglePopoverVisible] = useToggle(true)
  const types: MetaObject['type'][] = ['image', 'normal', 'note', 'noteElement', 'pdf', 'pdfElement']
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
            width: 700,
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
            <div>{typeToTypeRecord[type]}</div>
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
    >
      <Content
        flex
        alignItems="center"
        gap={5}
        onClick={togglePopoverVisible}
        style={{
          borderRadius: 999,
          padding: '4px 8px',
          border: '1px solid rgba(0,0,0,0.1)',
          fontFamily: 'Muli',
          textTransform: 'capitalize'
        }}
      >
        <Icon name="park-info" />
        {Array.from(filterTypes).map((i, idx) => (
          <>
            {idx !== 0 && <div style={{ height: '90%', margin: 'auto', borderRight: '1px solid rgba(0,0,0,0.1)' }}></div>}
            <div
              style={{
                fontSize: 13
              }}
            >
              {typeToTypeRecord[i]}
            </div>
          </>
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
const TagFilter = ({ onClose }: { onClose: VoidFunction }) => {
  const tagToMetaObjectsMap = useAtomValue(TagToMetaObjectIdsMapAtom, { store: globalStore })
  const allTags = useMemo(() => Array.from(tagToMetaObjectsMap.keys()), [tagToMetaObjectsMap])
  const databaseStore = useStore()
  const [filterSelectedTags, setFilterSeletedTags] = useAtom(FilterSelectedTagsAtom, { store: databaseStore })
  const [popoverVisible, togglePopoverVisible] = useToggle(true)
  const toggleTag = (tag: string) => {
    if (filterSelectedTags.has(tag)) {
      setFilterSeletedTags(
        produce(filterSelectedTags, draft => {
          draft.delete(tag)
        })
      )
    } else {
      setFilterSeletedTags(
        produce(filterSelectedTags, draft => {
          draft.add(tag)
        })
      )
    }
  }
  const renderPopover = () => {
    return (
      <Content
        className={css([
          {
            width: 700,
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
        {allTags.map(i => (
          <Content flex alignItems="center" gap={10} className={ClassName.flatButton()} onClick={() => toggleTag(i)}>
            <CheckBox checked={filterSelectedTags.has(i)} />
            <Tag tag={i} hideDelete onClick={e => e.stopPropagation()} hideAdd key={i} />
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
    >
      <Content
        flex
        gap={5}
        onClick={togglePopoverVisible}
        style={{
          borderRadius: 999,
          padding: '4px 8px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Icon name="park-tag-one" />
        {Array.from(filterSelectedTags).map(i => (
          <Tag key={i} tag={i} small hideAdd hideDetails hideDelete hideSize />
        ))}
        <Icon
          className={ClassName.circleButton()}
          name="park-close"
          onClick={() => {
            setFilterSeletedTags(new Set<string>())
            onClose()
          }}
        />
      </Content>
    </AnimatePopover>
  )
}

const CreateTimeFilter = ({ onClose }: { onClose: VoidFunction }) => {
  const databaseStore = useStore()
  const [filterInterval, setFilterInterval] = useAtom(FilterDateIntervalsAtom, { store: databaseStore })
  const [popoverVisible, togglePopoverVisible] = useToggle(true)

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
            borderRight: '1px solid rgba(222,222,222, 0.8)',
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
    >
      <Content
        alignItems="center"
        gap={4}
        flex
        onClick={togglePopoverVisible}
        style={{
          borderRadius: 999,
          padding: '4px 8px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
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
export default DatabaseFilter
