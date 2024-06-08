import { CSSProperties, useEffect, useRef, useState } from 'react'
import { IMetaProp, MetaFilterGroup, MetaFilterRule, StringFieldFilterRule, TagFieldFilterRule, TypeFieldFilterRule } from '~/typings'
import { AnimatePopover, Button, Content, Icon, Menu, TimePicker, WithBorder } from '@/components'
import Select from '@/components/base/select'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from '@/hooks'
import produce from 'immer'
import { MetaStore } from '@/api/stores'
import Id from '@/utils/id'
import { useDropObjectArea } from '@/core'
import { SelectOptionProps } from '@/components/base/select/SelectOption'
import { Colors } from '@/consts'
import MetaFilterer from '@/core/object/filter/MetaFilterer'
import { css } from '@emotion/css'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { Rendevoz } from '@/core/rendevoz'
import { DateFormat } from '@/utils'
import SingleOptionFilter from '@/core/object/filter/renderer/SingleOption'
import MultiOptionFilter from '@/core/object/filter/renderer/MultiOption'
import NumberFilter from '@/core/object/filter/renderer/Number'
import CheckboxFilter from '@/core/object/filter/renderer/Checkbox'
import useDisplayInside from '@/core/object/objectList/useDisplayInside'
import Tag from '@/core/object/ObjectTag'
import SaveFilter from '@/core/object/filter/SaveFilter'

const commonStyle: CSSProperties = {
  cursor: 'pointer',
  lineHeight: '1.2',
  padding: '3px 8px',
  height: 26,
  maxWidth: 200,
  wordBreak: 'break-all',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  minWidth: 30,
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  background: 'transparent',
  borderRadius: 5,
  border: `1px solid ${Colors.Background.Border}`
}
const FilterSelect = ({
  options,
  onSelect,
  value,
  defaultValue,
  placeholder
}: {
  placeholder?: string
  options: SelectOptionProps[]
  onSelect: (v: string) => void
}) => {
  return (
    <Select
      align={'center'}
      reposition={false}
      closeOnSelect={true}
      menuStyle={{
        minWidth: 150,
        maxHeight: 300,
        overflowY: 'auto'
      }}
      style={commonStyle}
      onSelect={v => onSelect(v[0])}
      options={options}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
    />
  )
}

type ExtraFields = {
  icon: string
  // display text
  name: string
  // id
  value: number
  propType: string
}
const BetterFilter = ({
  root,
  onChange,
  disableAddGroup,
  visibleTypes,
  showHiddenMetas,
  extraFields,
  visibleFields,
  showSave = true
}: {
  disableAddGroup?: boolean
  root?: MetaFilterGroup
  showHiddenMetas?: boolean
  visibleTypes?: string[]
  visibleFields?: string[]
  onChange?: (root: MetaFilterGroup) => void
  // custom property
  extraFields?: ExtraFields[]
  showSave?: boolean
}) => {
  const [showSavedFilters, setShowSavedFilters] = useState(false)
  const { renderSavedFilters, savedFilters, renderNameEditor, save, lastUsedFilter } = SaveFilter.useRenderSavedFilters(
    filters => {
      setFilterRoot(filters)
    },
    () => {
      setShowSavedFilters(false)
    }
  )
  const [filterRoot, setFilterRoot] = useState<MetaFilterGroup>(
    root || {
      filterType: 'group',
      groupType: 'and',
      rules: []
    }
  )
  useEffect(() => {
    onChange?.(filterRoot)
  }, [filterRoot])
  const handleChange = useMemoizedFn((rule: MetaFilterRule) => {
    setFilterRoot(s =>
      produce(s, draft => {
        const ruleIdx = s.rules.findIndex(f => f.id === rule.id)
        draft.rules[ruleIdx] = rule
      })
    )
  })

  const handleDelete = useMemoizedFn((id: number) => {
    setFilterRoot(s =>
      produce(s, draft => {
        const ruleIdx = s.rules.findIndex(f => f.id === id)
        draft.rules.splice(ruleIdx, 1)
      })
    )
  })
  const { t } = useTranslation()
  return (
    <>
      {renderNameEditor()}
      {showSavedFilters ? (
        <Content style={{ width: 300, minWidth: '100%', maxWidth: '100%' }}>{renderSavedFilters()}</Content>
      ) : (
        <>
          {savedFilters?.length ? (
            <div
              onClick={() => setShowSavedFilters(true)}
              style={{
                padding: '4px',
                width: '100%'
              }}
              className={'border-bottom font-size-13'}
            >
              <Button.IconButton icon={'park-filter'} text={t('filter.Saved filters')} suffixIcon={'park-right'}></Button.IconButton>
            </div>
          ) : null}
          <Content
            flex
            gap={8}
            column={true}
            className={css({
              minWidth: 240,
              fontSize: 13,
              padding: 8
            })}
          >
            {filterRoot.rules.map((i, idx) => (
              <FilterItem
                visibleTypes={visibleTypes}
                onChangeGroupType={v => {
                  setFilterRoot({ ...filterRoot, groupType: v })
                }}
                extraFields={extraFields}
                index={idx}
                visibleFields={visibleFields}
                onDelete={handleDelete}
                groupType={filterRoot.groupType}
                rule={i}
                key={idx}
                showHiddenMetas={showHiddenMetas}
                onChange={handleChange}
              />
            ))}
            <div style={{ width: 280, maxWidth: '100%', minWidth: '100%', flexWrap: 'wrap', display: 'flex', columnGap: 10, rowGap: 8 }}>
              <Button.IconButton
                size={11}
                gap={6}
                style={commonStyle}
                onClick={() => {
                  setFilterRoot(s =>
                    produce(s, draft => {
                      if (visibleFields) {
                        if (visibleFields.includes('type')) {
                          draft.rules.push({
                            filterType: 'rule',
                            field: 'type',
                            value: '',
                            type: 'is',
                            id: Id.getId()
                          })
                        } else {
                          draft.rules.push({
                            filterType: 'rule',
                            field: 'name',
                            value: '',
                            type: 'contains',
                            id: Id.getId()
                          })
                        }
                        return
                      }
                      draft.rules.push({
                        filterType: 'rule',
                        field: 'type',
                        value: '',
                        type: 'is',
                        id: Id.getId()
                      })
                    })
                  )
                }}
                text={t('filter.Filter')}
                icon={'park-plus'}
              />
              {!disableAddGroup && (
                <Button.IconButton
                  size={11}
                  gap={6}
                  style={commonStyle}
                  onClick={() => {
                    setFilterRoot(s =>
                      produce(s, draft => {
                        draft.rules.push({
                          filterType: 'group',
                          id: Id.getId(),
                          groupType: 'and',
                          rules: [
                            {
                              filterType: 'rule',
                              field: 'name',
                              value: '',
                              type: 'contains',
                              id: Id.getId()
                            }
                          ]
                        })
                      })
                    )
                  }}
                  text={t('filter.Filter group')}
                  icon={'park-plus'}
                />
              )}
              {filterRoot.rules.length && showSave && !savedFilters?.some(i => i.filter === filterRoot) ? (
                <>
                  <Button.IconButton
                    size={11}
                    gap={6}
                    style={commonStyle}
                    onClick={() => {
                      save(filterRoot)
                    }}
                    text={t('filter.Save filter')}
                    icon={'park-save'}
                  />
                  {lastUsedFilter && (
                    <Button.IconButton
                      size={11}
                      gap={6}
                      style={commonStyle}
                      onClick={() => {
                        save(filterRoot, lastUsedFilter.id)
                      }}
                      text={t('filter.Save as') + ' ' + (lastUsedFilter.name || 'Unnamed filter')}
                      icon={'park-save'}
                    />
                  )}
                </>
              ) : null}
            </div>
          </Content>
        </>
      )}
    </>
  )
}

const FilterItem = ({
  rule,
  groupType,
  onChange,
  onDelete,
  index,
  onChangeGroupType,
  visibleTypes,
  visibleFields,
  extraFields = [],
  showHiddenMetas
}: {
  rule: MetaFilterRule
  groupType: 'and' | 'or'
  visibleFields?: string[]
  onChange: (newRule: MetaFilterRule) => void
  onDelete: (id: number) => void
  index: number
  onChangeGroupType: (t: 'and' | 'or') => void
  visibleTypes?: string[]
  extraFields?: ExtraFields[]
  showHiddenMetas?: boolean
}) => {
  const filterType = rule.filterType
  const { t } = useTranslation()
  let availableFilters = [
    {
      type: 'item',
      key: 'type',
      text: t('filter.Type'),
      icon: 'park-all-application'
    },
    {
      type: 'item',
      key: 'contains',
      text: t('filter.Contained in'),
      icon: 'park-hamburger-button'
    },
    {
      type: 'item',
      key: 'name',
      text: t('filter.Name'),
      icon: 'park-edit'
    },
    {
      type: 'item',
      key: 'description',
      text: t('filter.Description'),
      icon: 'park-info'
    },
    {
      type: 'item',
      key: 'tags',
      text: t('filter.Tags'),
      icon: 'park-tag-one'
    },
    {
      type: 'item',
      key: 'relationship',
      text: t('filter.Relationships'),
      icon: 'park-share-one'
    },
    {
      type: 'item',
      key: 'createdAt',
      text: t('filter.Created at'),
      icon: 'park-time'
    },
    {
      type: 'item',
      key: 'viewAt',
      icon: 'park-preview-open',
      text: t('filter.Last viewed')
    }
  ]
  if (visibleFields) {
    const set = new Set(visibleFields)
    availableFilters = availableFilters.filter(i => (i.key ? set.has(i.key) : true))
  }
  const filterableCustomProps: IMetaProp['propType'][] = [
    'string',
    'date',
    'number',
    'singleSelect',
    'multiSelect',
    'URL',
    'checkbox',
    'AI summary',
    'reviewState'
  ]
  const propSet = new Set(filterableCustomProps)
  if (extraFields.length) {
    availableFilters.push({
      type: 'item',
      key: 'properties',
      text: t('general.Properties'),
      subMenu: extraFields
        .filter(i => propSet.has(i.propType))
        .map(i => ({
          key: i.value,
          text: i.name,
          icon: i.icon,
          type: 'item',
          propType: i.propType
        }))
    })
  }
  const renderOptions = () => {
    if (filterType === 'rule') {
      if ('propType' in rule) {
        switch (rule.propType) {
          case 'number':
            return <NumberFilter rule={rule} onChange={onChange} />
          case 'URL':
          case 'string':
          case 'AI summary':
            return <StringFilter rule={rule} onChange={onChange} />
          case 'singleSelect':
          case 'reviewState':
            return <SingleOptionFilter rule={rule} onChange={onChange} />
          case 'multiSelect':
            return <MultiOptionFilter rule={rule} onChange={onChange} />
          case 'checkbox':
            return <CheckboxFilter rule={rule} onChange={onChange} />
          case 'date':
            return <DateFilter rule={rule} onChange={onChange} />
        }
      }

      switch (rule.field) {
        case 'contains':
          return <ContainFilter rule={rule} onChange={onChange} />
        case 'name':
        case 'description':
          return <StringFilter rule={rule} onChange={onChange} />
        case 'type':
          return <TypeFilter showHiddenMetas={showHiddenMetas} visibleTypes={visibleTypes} rule={rule} onChange={onChange} />
        case 'updatedAt':
        case 'viewAt':
        case 'createdAt':
          return <DateFilter rule={rule} onChange={onChange} />
        case 'tags':
          return <TagFilter rule={rule} onChange={onChange} />
      }
    }
    if (filterType === 'link') {
      return <RelationshipFilter rule={rule} onChange={onChange} />
    }
    if (filterType === 'group') {
      return (
        <div className={'border'} style={{ minWidth: 240, padding: 6, borderRadius: 6 }}>
          <BetterFilter root={rule} disableAddGroup={true} onChange={r => onChange(r)} />
        </div>
      )
    }
    return null
  }
  const renderPrefix = () => {
    if (index === 0) {
      return t('filter.where')
    }
    if (index === 1) {
      return (
        <FilterSelect
          options={[
            {
              value: 'and',
              children: t('filter.and')
            },
            {
              value: 'or',
              children: t('filter.or')
            }
          ]}
          defaultValue={groupType}
          onSelect={v => onChangeGroupType(v)}
        />
      )
    }
    if (index > 1) {
      return t(`filter.${groupType}`)
    }
  }
  console.log(rule)
  let icon = (availableFilters.find(i => i.key === rule.field) || extraFields.find(i => i.value === rule.field))?.icon
  let name = availableFilters.find(i => i.key === rule.field)?.text || extraFields.find(i => i.value === rule.field)?.name
  if (filterType === 'link') {
    name = t('filter.Relationships')
    icon = 'park-share-one'
  }
  return (
    <Content flex alignItems={'center'} gap={horizontalGap}>
      <div style={{ width: '4.5rem', paddingLeft: index === 1 ? 0 : '6px' }}>{renderPrefix()}</div>
      {rule.filterType !== 'group' && (
        <AnimatePopover
          positions={['bottom', 'top']}
          withClickCover
          content={setV => (
            <WithBorder padding={'0.4rem 0'}>
              <Menu.NavigationMenu
                defaultSelected={
                  filterType === 'rule' ? (rule.field ? [rule.field] : undefined) : filterType === 'link' ? ['relationship'] : undefined
                }
                layout={availableFilters}
                onSelect={v => {
                  setV(false)
                  if (v && 'propType' in v && v.propType) {
                    let type: string | undefined = undefined
                    switch (v.propType) {
                      case 'multiSelect':
                        type = 'contains'
                        break
                      case 'singleSelect':
                      case 'reviewState':
                      case 'date':
                        type = 'is'
                        break
                      case 'URL':
                      case 'string':
                      case 'AI summary':
                        type = 'contains'
                        break
                      case 'checkbox':
                      case 'number':
                        type = 'is'
                        break
                    }
                    onChange?.({ id: rule.id, filterType: 'rule', propType: v.propType, field: v.key, type })
                  }
                  if (!v || !('key' in v) || !v.key) return
                  switch (v.key) {
                    case 'relationship':
                      onChange?.({ id: rule.id, filterType: 'link', ruleType: 'is', metaType: 'spec', field: undefined, type: 'related' })
                      break
                    case 'name':
                    case 'description':
                      onChange?.({ id: rule.id, filterType: 'rule', type: 'contains', value: '', field: v.key })
                      break
                    case 'viewAt':
                    case 'updatedAt':
                    case 'createdAt':
                      onChange?.({ id: rule.id, filterType: 'rule', field: v.key, type: 'is', value: 'today' })
                      break
                    case 'type':
                      onChange?.({ id: rule.id, filterType: 'rule', field: v.key, type: 'is', value: '' })
                      break
                    case 'tags':
                      onChange?.({ id: rule.id, filterType: 'rule', type: 'contains', tagIds: [], field: 'tags' })
                      break
                    case 'contains':
                      onChange?.({ id: rule.id, filterType: 'rule', field: 'contains' })
                      break
                  }
                }}
              />
            </WithBorder>
          )}
        >
          <Content flex gap={8} alignItems={'center'} style={commonStyle}>
            <Icon name={icon} />
            <div>{name}</div>
          </Content>
        </AnimatePopover>
      )}
      {renderOptions()}
      <Icon
        name="park-close"
        className={ClassName.circleButton()}
        containerStyle={{ height: 'fit-content' }}
        onClick={() => onDelete(rule.id)}
      />
    </Content>
  )
}

const ContainFilter = ({ rule, onChange }: { rule: MetaFilterRule & { field: 'contains' }; onChange: (r: MetaFilterRule) => void }) => {
  const { renderMenu } = useDisplayInside({
    defaultSelected: rule.value ? [rule.value] : undefined,
    onSelect: v => {
      onChange?.({ ...rule, value: v.filter(i => i !== rule.value)[0] })
    }
  })
  const { t } = useTranslation()
  const selectedMeta = MetaStore.useValue(rule.value)
  return (
    <Content flex gap={horizontalGap}>
      <AnimatePopover positions={['bottom', 'top']} content={setV => renderMenu(() => setV(false))}>
        <div className={'ellipsis-font-1'} style={commonStyle}>
          {selectedMeta ? selectedMeta.name || selectedMeta.placeholderName : t('general.Select an option')}
        </div>
      </AnimatePopover>
    </Content>
  )
}

const DateFilter = ({
  rule,
  onChange
}: {
  rule: MetaFilterRule & { field: 'createdAt'; filterType: 'rule' }
  onChange: (r: MetaFilterRule) => void
}) => {
  const { t } = useTranslation()
  const typeOptions = [
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'on and before',
      children: t('filter.is on or before')
    },
    {
      value: 'before',
      children: t('filter.is before')
    },
    {
      value: 'on and after',
      children: t('filter.is on or after')
    },
    {
      value: 'after',
      children: t('filter.is after')
    },
    {
      value: 'empty',
      children: t('filter.is empty')
    },
    {
      value: 'not empty',
      children: t('filter.is not empty')
    }
  ]
  const dateOptions = [
    {
      value: 'today',
      children: t('filter.today')
    },
    {
      value: 'yesterday',
      children: t('filter.yesterday')
    },
    {
      value: 'one week ago',
      children: t('filter.one week ago')
    },
    {
      value: 'one month ago',
      children: t('filter.one month ago')
    },
    {
      value: 'three month ago',
      children: t('filter.three months ago')
    },
    {
      value: 'specific',
      children: t('filter.specific date')
    }
  ]
  return (
    <Content flex gap={horizontalGap}>
      <FilterSelect options={typeOptions} value={rule.type} onSelect={v => onChange({ ...rule, type: v })} />
      {rule.type !== 'empty' && rule.type !== 'not empty' && (
        <FilterSelect
          options={dateOptions}
          value={rule.value}
          onSelect={v => {
            onChange({ ...rule, value: v })
          }}
        />
      )}
      {rule.value === 'specific' && (
        <AnimatePopover
          withClickCover={true}
          positions={['bottom']}
          content={setVisible => (
            <WithBorder padding={6} style={{ width: 240, fontSize: 13 }}>
              <TimePicker
                onChange={v => {
                  setVisible(false)
                  onChange({ ...rule, specDate: v.getTime() })
                }}
              />
            </WithBorder>
          )}
        >
          <div style={commonStyle}>{rule.specDate ? DateFormat.format(rule.specDate, DateFormat.Formats.default) : 'Select date'}</div>
        </AnimatePopover>
      )}
    </Content>
  )
}

const StringFilter = ({ rule, onChange }: { rule: StringFieldFilterRule; onChange: (newRule: StringFieldFilterRule) => void }) => {
  const { t } = useTranslation()
  const stringFilterOptions = [
    {
      value: 'contains',
      children: t('filter.contains')
    },
    {
      value: 'not contains',
      children: t('filter.not contains')
    },
    {
      value: 'not empty',
      children: t('filter.is not empty')
    },
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'is not',
      children: t('filter.is not')
    },
    {
      value: 'starts with',
      children: t('filter.starts with')
    },
    {
      value: 'ends with',
      children: t('filter.ends with')
    }
  ]
  return (
    <Content flex gap={horizontalGap}>
      <FilterSelect
        options={stringFilterOptions}
        defaultValue="contains"
        onSelect={v => {
          onChange?.({ ...rule, type: v })
        }}
        value={rule.type}
      />
      {rule.type !== 'not empty' && (
        <input
          value={rule.value}
          className={'border'}
          onChange={e => {
            onChange?.({ ...rule, value: e.target.value })
          }}
          placeholder={t('filter.value')}
          style={{
            borderRadius: 6,
            padding: '3px 8px',
            lineHeight: 1.2,
            width: 120
          }}
        />
      )}
    </Content>
  )
}

const TypeFilter = ({
  rule,
  onChange,
  visibleTypes,
  showHiddenMetas
}: {
  rule: TypeFieldFilterRule
  onChange: (newRule: MetaFilterRule) => void
  visibleTypes?: string[]
  showHiddenMetas?: boolean
}) => {
  const { t } = useTranslation()
  const existedTypes =
    visibleTypes ||
    (showHiddenMetas ? Array.from(MetaStore.getIndexedMetaObjects()?.typeToMetaObjectIdsMap.keys() || []) : MetaStore.getVisibleMetaTypes())
  const options = [
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'is not',
      children: t('filter.is not')
    }
  ]
  return (
    <Content flex gap={horizontalGap}>
      <FilterSelect
        onSelect={v => {
          onChange({ ...rule, type: v })
        }}
        value={rule.type}
        options={options}
        defaultValue={'is'}
      />
      <FilterSelect
        onSelect={v => {
          onChange({ ...rule, value: v })
        }}
        value={rule.value}
        placeholder={t('general.Select type')}
        options={existedTypes
          .map(i => ({
            value: i,
            children: Rendevoz.Utils.Meta.getTypeName(i)
          }))
          .sort((a, b) => a.children.localeCompare(b.children))}
      />
    </Content>
  )
}

const RelationshipFilter = ({ rule, onChange }: { rule: any; onChange: (newRule: MetaFilterRule) => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [metaName, setMetaname] = useState('')
  useDropObjectArea(ref, {
    onDrop: element => {
      if (element.type === 'metaElement') {
        const meta = MetaStore.getMetaObjectsMap().get(element.metaId)
        onChange({ ...rule, linkType: 'spec', metaId: element.metaId })
        setMetaname(meta?.name)
      }
    }
  })
  const { t } = useTranslation()
  const single = rule.ruleType === 'is' || rule.ruleType === 'is not'
  useEffect(() => {
    onChange({ ...rule, metaType: single ? 'spec' : 'rule' })
  }, [rule.ruleType])
  useEffect(() => {
    const meta = MetaStore.getMetaObjectsMap().get(rule.metaId)
    setMetaname(meta?.name)
  }, [rule.metaId])
  return (
    <Content flex gap={horizontalGap}>
      <FilterSelect
        options={[
          {
            value: 'related',
            children: t('filter.related')
          },
          {
            value: 'source',
            children: t('filter.source')
          },
          {
            value: 'target',
            children: t('filter.target')
          }
        ]}
        onSelect={v => onChange({ ...rule, type: v })}
        defaultValue="related"
        value={rule.type}
      />
      <FilterSelect
        options={[
          {
            value: 'is',
            children: t('filter.is')
          },
          {
            value: 'is not',
            children: t('filter.is not')
          },
          {
            value: 'contains',
            children: t('filter.is in')
          },
          {
            value: 'not contains',
            children: t('filter.is not in')
          }
        ]}
        onSelect={v => onChange({ ...rule, ruleType: v })}
        defaultValue="is"
        value={rule.ruleType}
      />
      <AnimatePopover
        positions={['bottom']}
        withClickCover={true}
        content={setVisible => (
          <WithBorder>
            {rule.metaType === 'spec' ? (
              <MetaFilterer
                onChange={v => {
                  onChange({ ...rule, metaId: v })
                  setVisible(false)
                }}
              />
            ) : (
              <BetterFilter onChange={r => onChange({ ...rule, group: r })} root={rule.group} />
            )}
          </WithBorder>
        )}
      >
        <div style={{ ...commonStyle, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {rule.metaType === 'spec' && rule.metaId ? MetaStore.getMetaObjectsMap().get(rule.metaId)?.name : 'Select objects'}
        </div>
      </AnimatePopover>
    </Content>
  )
}

const TagFilter = ({ rule, onChange }: { rule: TagFieldFilterRule; onChange: (newRule: MetaFilterRule) => void }) => {
  const { t } = useTranslation()
  const filterOptions = [
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'is not',
      children: t('filter.is not')
    },
    {
      value: 'contains',
      children: t('filter.contains')
    },
    {
      value: 'not contains',
      children: t('filter.not contains')
    },
    {
      value: 'empty',
      children: t('filter.is empty')
    },
    {
      value: 'not empty',
      children: t('filter.is not empty')
    }
  ]
  return (
    <Content flex gap={horizontalGap}>
      <FilterSelect options={filterOptions} value={rule.type} onSelect={v => onChange({ ...rule, type: v })} />
      {!['empty', 'not empty'].includes(rule.type) && (
        <AnimatePopover
          positions={['bottom']}
          padding={8}
          withClickCover={true}
          content={setV => (
            <WithBorder>
              <MetaTagPicker
                style={{ width: '250px' }}
                selectMode={true}
                alreadyTags={rule.tagIds || []}
                onChange={v => {
                  onChange({ ...rule, tagIds: v })
                  setV(false)
                }}
              />
            </WithBorder>
          )}
        >
          <div
            style={{
              ...commonStyle,
              padding: rule.tagIds?.length ? '3px 4px' : commonStyle.padding,
              overflow: 'hidden',
              display: 'flex',
              gap: 4
            }}
          >
            {rule.tagIds?.length
              ? rule.tagIds.map(i => <Tag tag={i} key={i} small square style={{ fontSize: 12, lineHeight: '16px' }} />)
              : t('general.Select tags')}
          </div>
        </AnimatePopover>
      )}
    </Content>
  )
}
const horizontalGap = 10
export default BetterFilter as typeof BetterFilter & {
  commonStyle: typeof commonStyle
  FilterSelect: typeof FilterSelect
  horizontalGap: number
}
BetterFilter.horizontalGap = horizontalGap
BetterFilter.commonStyle = commonStyle
BetterFilter.FilterSelect = FilterSelect
