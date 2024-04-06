import { MetaGroupChild, MetaGroupProperty } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { Content, Icon, Image, Tooltip } from '@/components'
import classnames from 'classnames'
import React, { Fragment, memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import useSelectCheck from '@/core/components/group/hooks/select/useSelectCheck'
import { Colors, KEY } from '@/consts'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { ClassName } from 'rendevoz'
import useItemDrag from '@/core/components/group/hooks/drag/useItemDrag'
import useDragInRow from '@/core/components/group/hooks/drag/useDragInRow'
import { useGlobalIsDragging } from '@/core'
import { useIsIn } from '@/hooks'
import isHotkey from 'is-hotkey'
import TextProp from '@/core/object/renderer/properties/TextProp'
import URLProp from '@/core/object/renderer/properties/URLProp'
import CheckboxProp from '@/core/object/renderer/properties/CheckboxProp'
import SelectProp from '@/core/object/renderer/properties/SelectProp'
import DateProp from '@/core/object/renderer/properties/DateProp'
import MultiSelectProp from '@/core/object/renderer/properties/MultiSelectProp'
import TypeCell from '@/core/components/group/components/table/cells/TypeCell'
import OriginalTextProp from '@/core/object/renderer/properties/OriginalTextProp'
import { TagCell } from '@/core/components/group/components/table/cells'
import { useTranslation } from 'react-i18next'
import FileProp from '@/core/object/renderer/properties/FileProp'
import { css } from '@emotion/css'
const moveCursorToEnd = node => {
  const range = document.createRange()
  const selection = window.getSelection()
  range.setStart(node, node.childNodes.length)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}
export const WrapperClassName = css({
  ':empty': {
    padding: '0 !important',
    marginLeft: '0 !important'
  }
})
export default memo(
  ({ rowDetails, visibleProps, showDeleted }: { rowDetails: MetaGroupChild; showDeleted?: boolean; visibleProps?: any }) => {
    const meta = MetaStore.useValue(rowDetails.id)
    const icon = meta && Rendevoz.Utils.Object.getMetaObjectIcon(meta.type)
    const { ref: bodyRef, isIn } = useIsIn()
    const { checkIntersect, isSelected, clearSelectState, select,scrollIntoView } = useSelectCheck(bodyRef, rowDetails)
    const instance = useGroupInstance()
    const dragContainerRef = useRef<HTMLDivElement>(null)

    useItemDrag(bodyRef, rowDetails)
    const [globalIsDragging] = useGlobalIsDragging()
    const { renderIndicator } = useDragInRow({
      rowRef: dragContainerRef,
      value: rowDetails,
      canInner: false,
      top: '100%'
    })
    const [isEditing, setIsEditing] = useState(false)
    useEffect(() => {
      const rowId = rowDetails.tempRowId || rowDetails.rowId
      instance.values.inViewRowFuncs.set(rowId, {
        checkIntersected: checkIntersect,
        clearSelectState,
        select,
        edit: () => setIsEditing(true),
        unedit: () => setIsEditing(false),
        scrollIntoView
      })
      return () => {
        instance.values.inViewRowFuncs.delete(rowId)
      }
    })
    const { t } = useTranslation()
    const inputRef = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
      const text = inputRef.current
      if (text) {
        if (isEditing) {
          setTimeout(() => {
            moveCursorToEnd(text)
            text.focus()
          })
          text.textContent = meta?.name || ''
        } else {
          text.textContent = meta?.name || meta?.placeholderName || ''
        }
      }
    }, [isEditing, meta?.name, meta?.placeholderName])

    if (!meta) return null
    if (!showDeleted && meta.deleted) return null

    const render = (prop: MetaGroupProperty) => {
      if (prop.type === 'custom') {
        const v = meta.properties?.[prop.id]?.value
        const n = `${prop.id}`
        const realProp = MetaStore.getPropDetails(prop.id)
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
          case 'AI summary':
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
                style={{
                  alignItems: 'center'
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
          case 'tags':
            return (
              meta.tags?.length && (
                <TagCell
                  optionStyle={{
                    fontSize: 12,
                    lineHeight: '18px'
                  }}
                  value={value}
                  metaId={meta.id}
                />
              )
            )
          case 'originalText':
            return meta.objectId && <OriginalTextProp type={meta.type} objectId={meta.objectId} />
        }
      }
    }
    const propRender = (prop: MetaGroupProperty) => {
      const realProp = MetaStore.getPropDetails(prop.id)
      const rendered = render(prop)

      const tooltipContent = prop.type === 'basic' ? t(prop.display) : realProp?.name
      if (!rendered) {
        return null
      }
      if (isEditing) {
        return null
      }
      return (
        <Tooltip content={tooltipContent} positions={['top']}>
          <div
            role={'prop'}
            className={classnames(ClassName.flatButton(3, '4px'), WrapperClassName)}
            style={{
              width: 'fit-content',
              overflow: 'hidden',
              transition: 'background 0.25s ease',
              flexWrap: 'nowrap',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              wordBreak: 'break-all',
              fontSize: 12,
              lineHeight: '18px',
              marginLeft: 2
            }}
          >
            {rendered}
          </div>
        </Tooltip>
      )
    }
    return (
      <div
        style={{
          padding: '1px 0px',
          position: 'relative'
        }}
        ref={dragContainerRef}
      >
        {renderIndicator()}
        <Content
          flex
          ref={bodyRef}
          alignItems={'center'}
          role={'group-item-content'}
          className={ClassName.flatButton(4, '4px 6px')}
          onContextMenu={e => {
            e.preventDefault()
            if (instance.values.selectedRowIdSet.size === 1) {
              instance.selectOps?.clearAllSelect()
            }
            select()
            instance.overlayOps?.open(
              {
                type: 'itemContextMenu',
                details: rowDetails,
                align: 'start'
              },
              {
                x: e.clientX,
                y: e.clientY
              }
            )
          }}
          onClick={e => {
            if (isEditing) return
            if (e.target === e.currentTarget) {
              instance.openObject?.(meta.id, rowDetails.rowId)
            }
          }}
          style={{
            height: 34,
            transition: 'background 0.25s ease, box-shadow 0.25s ease',
            cursor: isEditing ? 'text' : globalIsDragging ? 'grabbing' : 'pointer',
            boxShadow: isEditing ? Colors.Common.FocusBoxShadow : undefined,
            background: globalIsDragging || isEditing ? 'transparent' : isSelected ? Colors.Common.SelectColorTransparent : undefined
          }}
        >
          {meta.coverImgSrc ? (
            <Image
              containerStyle={{
                borderRadius: 4
              }}
              src={meta.coverImgSrc}
              preview
              width={30}
            />
          ) : icon ? (
            <Icon size={18} name={icon} className={'transparent-font'} />
          ) : null}
          <div
            ref={inputRef}
            style={{
              fontSize: 15,
              borderBottom: isEditing ? undefined : Colors.Consts.Border,
              pointerEvents: isEditing ? 'auto' : 'none',
              fontWeight: 500,
              minWidth: 'fit-content',
              maxWidth: 'calc(100% - 64px)',
              overflow: 'hidden',
              marginLeft: 10,
              flexShrink: 1,
              flexGrow: isEditing ? 1 : 0
            }}
            contentEditable={isEditing}
            tabIndex={0}
            onKeyDown={e => {
              if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault()
                return
              }
              if (isHotkey(KEY.Enter, e) || isHotkey(KEY.Escape, e)) {
                setTimeout(() => {
                  inputRef.current?.blur()
                  select()
                })
                e.preventDefault()
              }
            }}
            onBlur={e => {
              instance.values.isFocused = true
              instance.metaOps?.updateMeta({ id: meta.id, name: e.target.textContent }).then(() => {
                setIsEditing(false)
              })
            }}
            spellCheck={'false'}
            defaultValue={isEditing ? meta.name : meta.name || meta.placeholderName}
            className={classnames(!meta.name && 'transparent-font', 'ellipsis-font-1')}
          />
          {
            <Icon
              size={16}
              name={'park-edit'}
              onClick={() => {
                if (instance.values.selectedRowIdSet.size === 1) {
                  instance.selectOps?.clearAllSelect()
                }
                setIsEditing(!isEditing)
              }}
              className={ClassName.flatButton()}
              style={{
                flexShrink: 0,
                opacity: isIn && !isEditing ? 1 : 0,
                boxShadow: Colors.Background.BorderBoxShadow,
                borderRadius: 4,
                marginRight: 'auto',
                padding: '4px',
                marginLeft: 10
              }}
            />
          }
          {visibleProps.map(i => (
            <Fragment key={i.id}>{propRender(i)}</Fragment>
          ))}
        </Content>
      </div>
    )
  }
)
