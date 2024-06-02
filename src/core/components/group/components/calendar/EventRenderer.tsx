import React, { Fragment, memo, useEffect, useRef } from 'react'
import { EventProps } from 'react-big-calendar'
import { MetaStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import { format } from 'date-fns'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaGroupChild, MetaGroupProperty } from '~/typings'
import useSelectCheck from '@/core/components/group/hooks/select/useSelectCheck'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import TextProp from '@/core/object/renderer/properties/TextProp'
import URLProp from '@/core/object/renderer/properties/URLProp'
import CheckboxProp from '@/core/object/renderer/properties/CheckboxProp'
import SelectProp from '@/core/object/renderer/properties/SelectProp'
import DateProp from '@/core/object/renderer/properties/DateProp'
import MultiSelectProp from '@/core/object/renderer/properties/MultiSelectProp'
import FileProp from '@/core/object/renderer/properties/FileProp'
import TypeCell from '@/core/components/group/components/table/cells/TypeCell'
import AttCell from '@/core/components/group/components/table/cells/AttCell'
import { FromCell, RelatedCell, TagCell } from '@/core/components/group/components/table/cells'
import OriginalTextProp from '@/core/object/renderer/properties/OriginalTextProp'
import classnames from 'classnames'
import { WrapperClassName } from '@/core/components/group/components/gallery/GalleryItemWrapper'
import { useTranslation } from 'react-i18next'
import { selectAtom } from 'jotai/utils'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { isEqual } from 'lodash'
import { useAtomValue } from 'jotai'

const CalendarItemSelectAtom = selectAtom(
  GroupStateAtom,
  s => ({
    visibleProps: s.visibleProperties
  }),
  (a, b) => isEqual(a, b)
)
export default memo(({ event }: EventProps) => {
  const row = event.resource as MetaGroupChild
  const meta = MetaStore.useValue(row.id)
  const instance = useGroupInstance()
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const { visibleProps } = useAtomValue(CalendarItemSelectAtom)
  const { checkIntersect, isSelected, clearSelectState, select, scrollIntoView } = useSelectCheck(ref, row)
  useEffect(() => {
    instance.values.inViewRowFuncs.set(row.tempRowId || row.rowId, {
      checkIntersected: checkIntersect,
      clearSelectState,
      scrollIntoView,
      select
    })
    return () => {
      instance.values.inViewRowFuncs.delete(row.tempRowId || row.rowId)
    }
  })
  const render = (prop: MetaGroupProperty) => {
    if (!meta) return
    if (prop.type === 'custom') {
      const v = meta.properties?.[prop.id]?.value
      const n = `${prop.id}`
      const realProp = MetaStore.property.getPropDetails(prop.id)
      if (v === undefined && (!realProp || !['checkbox'].includes(realProp.propType))) return null
      const handleChange = nv => {
        instance.metaOps?.updateMetaProperty(
          n,
          {
            value: nv
          },
          meta.id
        )
      }
      switch (realProp?.propType) {
        case 'number':
        case 'string':
        case 'AI summary':
          return <TextProp value={v} mode={prop.propType === 'number' ? 'number' : 'text'} onChange={handleChange} />
        case 'URL':
          return <URLProp value={v} onChange={handleChange} />
        case 'checkbox':
          return <CheckboxProp checkBoxSize={14} value={v} onChange={handleChange} name={realProp.name} />
        case 'reviewState':
        case 'singleSelect':
          return (
            <SelectProp
              optionStyle={{
                fontSize: 12,
                lineHeight: '18px'
              }}
              metaId={meta.id}
              fieldName={n}
              value={v}
              onChange={handleChange}
            />
          )
        case 'date':
          return (
            <DateProp
              value={v}
              style={{
                fontSize: 12,
                lineHeight: '18px'
              }}
              onChange={handleChange}
            />
          )
        case 'multiSelect':
          return (
            <MultiSelectProp
              optionStyle={{
                fontSize: 12,
                lineHeight: '18px'
              }}
              metaId={meta.id}
              fieldName={n}
              value={v}
              onChange={handleChange}
            />
          )
        case 'file':
          return (
            <FileProp
              value={v}
              onChange={handleChange}
              optionStyle={{
                height: 18,
                fontSize: 12,
                lineHeight: '18px'
              }}
            />
          )
      }
    }
    if (prop.type === 'basic') {
      const field = prop.name
      const value = meta[field]
      const handleChange = v => {
        instance.metaOps?.updateMeta({ id: meta.id, [field]: v })
      }
      switch (prop.name) {
        case 'type':
          return <TypeCell style={{ fontSize: 12 }} value={value} />
        case 'attachments':
          return (
            meta.attachments?.length && (
              <AttCell
                style={{
                  fontSize: 12,
                  lineHeight: '18px',
                  height: 18
                }}
                metaId={meta.id}
              />
            )
          )
        case 'related':
          return (
            <RelatedCell
              metaId={meta.id}
              nullIfNoRelated
              optionStyle={{
                fontSize: 12,
                lineHeight: '18px',
                height: 18
              }}
            />
          )
        case 'originalText':
          return meta.objectId && <OriginalTextProp objectId={meta.objectId} type={meta.type} />
        case 'description':
          return meta.description && <TextProp value={value} onChange={handleChange} />
        case 'fromObject':
          return <FromCell value={value} />
        case 'tags':
          return (
            meta.tags?.length && (
              <TagCell
                optionStyle={{
                  fontSize: 12,
                  lineHeight: '18px',
                  height: 18
                }}
                value={value}
                metaId={meta.id}
              />
            )
          )
      }
    }
  }
  const propRender = (prop: MetaGroupProperty) => {
    const realProp = MetaStore.property.getPropDetails(prop.id)
    const rendered = render(prop)

    const tooltipContent = prop.type === 'basic' ? t(prop.display) : realProp?.name
    if (!rendered) {
      return null
    }
    return (
      <Tooltip content={tooltipContent} positions={['left']}>
        <div
          role={'prop'}
          className={WrapperClassName}
          style={{
            width: 'fit-content',
            overflow: 'hidden',
            padding: '4px 0px',
            transition: 'background 0.25s ease',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            wordBreak: 'break-all',
            minWidth: '40px',
            fontSize: 12,
            lineHeight: '18px'
          }}
        >
          {rendered}
        </div>
      </Tooltip>
    )
  }
  return (
    <Content
      role={'group-item-content'}
      ref={ref}
      column
      onClick={e => {
        if (!e.target.closest('[role="prop"]') && e.currentTarget.contains(e.target)) {
          instance.openObject?.(row.id, row.tempRowId || row.rowId)
        }
      }}
      flex
      className={'light-hover br-6 bg-popover font-size-14 border-box-shadow'}
      style={{
        overflow: 'hidden',
        color: Colors.Font.Primary,
        padding: '2px 6px',
        transition: 'all 0.02s ease-out'
      }}
      onContextMenu={e => {
        e.preventDefault()
        if (instance.values.selectedRowIdSet.size === 1) {
          instance.selectOps?.clearAllSelect()
        }
        select()
        instance.overlayOps?.open(
          {
            type: 'itemContextMenu',
            details: row,
            align: 'start'
          },
          {
            x: e.clientX,
            y: e.clientY
          }
        )
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
          transition: 'all 0.2s ease'
        }}
      ></div>
      <Content flex alignItems={'center'} gap={8} justifyContent={'space-between'}>
        <div className={'normal-font font-size-13 ellipsis-font-1'}>{meta?.name || meta?.placeholderName}</div>
        {meta?.createdAt && <div className={'font-size-12 transparent-font'}>{format(meta.createdAt, 'HH:mm')}</div>}
      </Content>
      <div
        style={{
          overflow: 'hidden'
        }}
      >
        {visibleProps?.map(i => <Fragment key={i.id}>{propRender(i)}</Fragment>)}
      </div>
    </Content>
  )
})
