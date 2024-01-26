import { Colors } from '@/consts'
import { RelatedCell, FromCell, DisplayCell, EditableCell, TagCell } from './cells'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import ImageCell from '@/core/components/group/components/table/cells/ImageCell'
import TypeCell from '@/core/components/group/components/table/cells/TypeCell'
import ParentItemCell from '@/core/components/group/components/table/cells/ParentItemCell'
import LabelsCell from '@/core/components/group/components/table/cells/LabelsCell'
import { MetaStore } from '@/api/stores'
import { memo } from 'react'
import { MetaObject } from '~/typings'
import TextProp from '@/core/object/renderer/properties/TextProp'
import SelectProp from '@/core/object/renderer/properties/SelectProp'
import MultiSelectProp from '@/core/object/renderer/properties/MultiSelectProp'
import DateProp from '@/core/object/renderer/properties/DateProp'
import CheckboxProp from '@/core/object/renderer/properties/CheckboxProp'
import URLProp from '@/core/object/renderer/properties/URLProp'
import FileProp from '@/core/object/renderer/properties/FileProp'
import OriginalTextProp from '@/core/object/renderer/properties/OriginalTextProp'
import AIQuestionsProp from '@/core/object/renderer/properties/AIQuestionsProp'
import AttCell from '@/core/components/group/components/table/cells/AttCell'

const CellWrapper = memo(
  ({
    field,
    value,
    metaId,
    wrap,
    hasChildren,
    toggled,
    indent = 0,
    rowId,
    type,
    metaObject,
    placeholder,
    index
  }: {
    field: string
    value: string
    metaId: number
    wrap?: boolean
    index: number
    hasChildren?: boolean
    rowId: number
    metaObject: MetaObject
    indent?: number
    toggled?: boolean
    type: 'custom' | 'basic'
    placeholder?: string
  }) => {
    const instance = useGroupInstance()
    const showToggle = field === 'name' && !!hasChildren
    const selected = instance.viewOps?.tableOps?.useSelectedCell(rowId, index)
    const renderer = () => {
      if (type === 'custom') {
        const propType = MetaStore.getPropDetails(field)?.propType
        if (!propType) return null
        const value = metaObject.properties?.[field]?.value
        const handleChange = v => {
          instance.metaOps?.updateMetaProperty(
            field,
            {
              value: v
            },
            metaId
          )
        }
        switch (propType) {
          case 'AI summary':
          case 'string':
          case 'number':
            return (
              <TextProp
                mode={propType === 'string' || propType === 'AI summary' ? 'text' : 'number'}
                value={value}
                onChange={handleChange}
              />
            )
          case 'AI questions':
            return <AIQuestionsProp metaId={metaId} />
          case 'URL':
            return <URLProp value={value} onChange={handleChange} />
          case 'checkbox':
            return (
              <CheckboxProp
                style={{
                  padding: '3px 0px'
                }}
                onChange={handleChange}
                value={value}
              ></CheckboxProp>
            )
          case 'date':
            return <DateProp onChange={handleChange} value={value}></DateProp>
          case 'multiSelect': {
            return (
              <MultiSelectProp
                style={{
                  padding: '1px 0px'
                }}
                onChange={handleChange}
                fieldName={field}
                metaId={metaId}
                value={value}
              ></MultiSelectProp>
            )
          }
          case 'file': {
            return <FileProp value={value} onChange={handleChange} />
          }
          case 'singleSelect': {
            return (
              <SelectProp
                style={{
                  padding: '1px 0px'
                }}
                onChange={handleChange}
                metaId={metaId}
                fieldName={field}
                value={value}
              />
            )
          }
        }
        return null
      }
      switch (field) {
        case 'name': {
          const emptyValue = ['Untitled', 'Unnamed object', 'Unnamed Label', 'Unnamed Whiteboard', 'Unnamed group'].includes(value)
          return (
            <EditableCell
              value={emptyValue ? '' : value}
              placeholder={placeholder}
              showToggle={!!hasChildren}
              openMeta={metaId}
              toggled={toggled}
              rowId={rowId}
              indent={indent}
              style={{
                fontWeight: 500
              }}
              onChange={v => {
                instance.metaOps?.updateMeta({ id: metaId, [field]: v })
              }}
            />
          )
        }
        case 'attachments':
          return <AttCell metaId={metaId} />
        case 'originalText':
          return metaObject.objectId && <OriginalTextProp objectId={metaObject.objectId} type={metaObject.type} />
        case 'description':
          return (
            <EditableCell
              value={value}
              onChange={v => {
                instance.metaOps?.updateMeta({ id: metaId, [field]: v })
              }}
            />
          )
        case 'labels':
          return <LabelsCell metaId={metaId} />
        case 'parentItems':
          return <ParentItemCell metaId={metaId} />
        case 'type':
          return <TypeCell value={value} />
        case 'coverImgSrc': {
          return (
            <ImageCell
              value={value}
              onChange={v => {
                if (!v) {
                  instance.metaOps?.updateMeta({ id: metaId, coverImgSrc: undefined })
                } else {
                  instance.metaOps?.updateMeta({ id: metaId, coverImgSrc: v })
                }
              }}
            />
          )
        }
        case 'fromObject':
          return <FromCell value={value} />
        case 'tags':
          return <TagCell wrap={wrap} value={value} metaId={metaId} />
        case 'viewAt':
        case 'updatedAt':
        case 'createdAt':
        case 'deletedAt':
          return <DisplayCell value={value} type={field} />
        case 'related':
          return <RelatedCell metaId={metaId} />
      }
    }
    return (
      <div
        data-cell={`${rowId}-${index}`}
        style={{
          position: 'relative',
          height: wrap ? undefined : '32px',
          padding: showToggle ? '5px 8px 5px 2px' : '5px 8px',
          minHeight: '32px',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          lineHeight: 1.5,
          wordBreak: 'break-all',
          overflow: wrap ? 'visible' : 'hidden',
          whiteSpace: wrap ? 'pre-wrap' : 'nowrap',
          borderRight: `1px solid ${Colors.Background.Border}`,
          cursor: 'pointer'
        }}
        onClick={e => {
          if (e.target === e.currentTarget) {
            e.currentTarget.querySelector('[role="prop-container"]')?.click()
          }
          console.log(field, index)
          instance.viewOps?.tableOps?.selectCell(rowId, index)
        }}
      >
        {renderer()}
        {selected && (
          <div
            style={{
              background: 'var(--select-color-transparent)',
              boxShadow: 'rgba(35, 131, 226, 0.57) 0px 0px 0px 1px inset',
              position: 'absolute',
              inset: 0,
              width: '100%',
              pointerEvents: 'none',
              zIndex: -1,
              height: '100%'
            }}
          ></div>
        )}
      </div>
    )
  }
)

export default CellWrapper
