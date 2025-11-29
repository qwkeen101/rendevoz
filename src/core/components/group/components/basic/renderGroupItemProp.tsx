import { IGroupInstance, IMetaProp, MetaGroupProperty, MetaObject } from '~/typings'
import TextProp from '@/core/object/renderer/properties/TextProp'
import URLProp from '@/core/object/renderer/properties/URLProp'
import CheckboxProp from '@/core/object/renderer/properties/CheckboxProp'
import SelectProp from '@/core/object/renderer/properties/SelectProp'
import DateProp from '@/core/object/renderer/properties/DateProp'
import MultiSelectProp from '@/core/object/renderer/properties/MultiSelectProp'
import QuestionProp from '@/core/object/renderer/properties/QuestionProp'
import FileProp from '@/core/object/renderer/properties/FileProp'
import React from 'react'
import { MetaStore } from '@/api/stores'
import TypeCell from '@/core/components/group/components/table/cells/TypeCell'
import AttCell from '@/core/components/group/components/table/cells/AttCell'
import { FromCell, RelatedCell, TagCell } from '@/core/components/group/components/table/cells'
import OriginalTextProp from '@/core/object/renderer/properties/OriginalTextProp'

export default ({
  prop,
  meta,
  instance,
  isEditing
}: {
  prop: MetaGroupProperty
  meta: MetaObject
  instance: IGroupInstance
  isEditing?: boolean
}) => {
  if (prop.type === 'custom') {
    const v = meta.properties?.[prop.id]?.value
    const n = `${prop.id}`
    const realProp = MetaStore.property.getPropDetails(prop.id)
    if (v === undefined && !isEditing && (!realProp || !['checkbox'].includes(realProp.propType))) return null
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
        return <TextProp value={v} mode={prop.propType === 'number' ? 'number' : 'text'} onChange={handleChange} />
      case 'URL':
        return <URLProp value={v} onChange={handleChange} />
      case 'checkbox':
        return <CheckboxProp checkBoxSize={14} value={v} onChange={handleChange} name={realProp.name} />
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
      case 'question':
        return (
          <QuestionProp
            value={v}
            optionStyle={{
              height: 18,
              fontSize: 12,
              lineHeight: '18px'
            }}
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
        return !isEditing && <TypeCell style={{ fontSize: 12 }} value={value} />
      case 'attachments':
        return (
          (meta.attachments?.length || isEditing) && (
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
          !isEditing && (
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
        )
      case 'originalText':
        return meta.objectId && <OriginalTextProp objectId={meta.objectId} type={meta.type} />
      case 'description':
        return (meta.description || isEditing) && <TextProp value={value} onChange={handleChange} />
      case 'fromObject':
        return !isEditing && <FromCell value={value} />
      case 'tags':
        return (
          (meta.tags?.length || isEditing) && (
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
