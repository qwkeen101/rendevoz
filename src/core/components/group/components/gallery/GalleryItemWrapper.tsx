import { MetaGroup, MetaGroupChild, MetaGroupProperty } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import ImageItem from '@/core/components/group/components/gallery/items/ImageItem'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useIsIn, useMergedRef } from '@/hooks'
import SelectProp from '@/core/object/renderer/properties/SelectProp'
import { ClassName } from 'rendevoz'
import MultiSelectProp from '@/core/object/renderer/properties/MultiSelectProp'
import DateProp from '@/core/object/renderer/properties/DateProp'
import useDragInGallery from '@/core/components/group/hooks/drag/useDragInGallery'
import React, { CSSProperties, forwardRef, Fragment, memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import useSelectCheck from '@/core/components/group/hooks/select/useSelectCheck'
import { Colors } from '@/consts'
import useItemDrag from '@/core/components/group/hooks/drag/useItemDrag'
import { useGlobalIsDragging } from '@/core'
import TextProp from '@/core/object/renderer/properties/TextProp'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
import URLProp from '@/core/object/renderer/properties/URLProp'
import CheckboxProp from '@/core/object/renderer/properties/CheckboxProp'
import OriginalTextProp from '@/core/object/renderer/properties/OriginalTextProp'
import AttCell from '@/core/components/group/components/table/cells/AttCell'
import TypeCell from '@/core/components/group/components/table/cells/TypeCell'
import { useTranslation } from 'react-i18next'
import { css } from '@emotion/css'
import classnames from 'classnames'
import { FromCell, RelatedCell, TagCell } from '@/core/components/group/components/table/cells'
import FileProp from '@/core/object/renderer/properties/FileProp'
import ContentDisplayer from '@/core/components/group/components/gallery/items/FixedHeightContentDisplayer'
import { useUpdate } from 'react-use'

export const WrapperClassName = css({
  ':empty': {
    padding: '0 !important'
  }
})

export default memo(
  forwardRef(
    (
      {
        rowDetails,
        hideCoverIfEmpty,
        style,
        dragPosition = 'lr',
        wrapContent,
        visibleProps,
        showCover,
        showDeleted,
        thumbnailMode,
        showOriginalText,
        ...rest
      }: {
        rowDetails: MetaGroupChild & { type: 'metaObject' }
        hideCoverIfEmpty?: boolean
        style?: CSSProperties
        wrapContent: boolean
        showOriginalText: boolean
        showCover?: (MetaGroup['views'][0] & { type: 'gallery' })['options']['cardCover']
        visibleProps: MetaGroupProperty[]
        thumbnailMode?: boolean
        showDeleted?: boolean
        dragPosition?: 'tb' | 'lr'
      },
      outerRef
    ) => {
      const meta = MetaStore.useValue(rowDetails.id)
      const instance = useGroupInstance()
      const bodyRef = useRef<HTMLDivElement>(null)
      const [isEditing, setIsEditing] = useState(false)
      const titleTextRef = useRef<HTMLTextAreaElement>(null)
      const { renderIndicator } = useDragInGallery({
        rowRef: bodyRef,
        value: rowDetails,
        dragIndicatorPosition: dragPosition,
        canDragInside: false
      })
      const [gDrag] = useGlobalIsDragging()
      const { isIn, ref } = useIsIn()
      const mergedRef = useMergedRef(outerRef, bodyRef)
      const { checkIntersect, isSelected, clearSelectState, select, scrollIntoView } = useSelectCheck(ref, rowDetails)
      useEffect(() => {
        instance.values.inViewRowFuncs.set(rowDetails.tempRowId || rowDetails.rowId, {
          checkIntersected: checkIntersect,
          clearSelectState,
          scrollIntoView,
          select,
          edit: () => {
            setIsEditing(true)
          },
          unedit: () => {
            setIsEditing(false)
          }
        })
        return () => {
          instance.values.inViewRowFuncs.delete(rowDetails.tempRowId || rowDetails.rowId)
        }
      })
      useLayoutEffect(() => {
        // update again to trigger height change
        const text = titleTextRef.current
        if (text) {
          if (isEditing) {
            text.focus()
            text.innerText = meta?.name || ''
          } else {
            if (showOriginalText && meta?.type.includes('Label')) {
              text.innerText = meta?.name || ''
            } else {
              text.innerText = meta?.name || meta?.placeholderName || ''
            }
          }
        }
      }, [isEditing, meta?.name, meta?.placeholderName, showOriginalText])
      const { t } = useTranslation()

      useItemDrag(bodyRef, rowDetails, {
        clickDrag: true,
        draggable: !isEditing,
        dragTriggerRef: ref
      })
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
      const propRender = (prop: MetaGroupProperty) => {
        const realProp = MetaStore.getPropDetails(prop.id)
        const rendered = render(prop)

        const tooltipContent = prop.type === 'basic' ? t(prop.display) : realProp?.name
        if (!rendered) {
          return null
        }
        if (isEditing) {
          return (
            <Tooltip content={tooltipContent} positions={['left']}>
              <div
                onClick={e => {
                  if (e.currentTarget.contains(e.target)) {
                    e.currentTarget.querySelector('[role="prop-container"]')?.click()
                  }
                }}
                className={classnames(ClassName.flatButton(3, '4px'), WrapperClassName)}
                style={{
                  width: 'auto',
                  margin: '0px 6px',
                  transition: 'background 0.25s ease',
                  minHeight: 26,
                  overflow: 'hidden',
                  alignItems: 'flex-start',
                  fontSize: 12,
                  lineHeight: '18px',
                  display: 'flex',
                  gap: 10
                }}
              >
                {(realProp?.icon || prop.icon) && (
                  <Icon
                    name={realProp?.icon || prop.icon}
                    style={{
                      color: Colors.Font.Transparent,
                      marginTop: 3
                    }}
                  />
                )}
                <div
                  style={{
                    minHeight: 18,
                    width: '100%',
                    flexWrap: wrapContent ? 'wrap' : 'nowrap',
                    whiteSpace: wrapContent ? 'pre-wrap' : 'nowrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {rendered}
                </div>
              </div>
            </Tooltip>
          )
        }
        return (
          <Tooltip content={tooltipContent} positions={['left']}>
            <div
              role={'prop'}
              className={classnames(ClassName.flatButton(3, '4px'), WrapperClassName)}
              style={{
                width: 'fit-content',
                maxWidth: '400px',
                margin: '0px 6px',
                overflow: 'hidden',
                transition: 'background 0.25s ease',
                flexWrap: wrapContent ? 'wrap' : 'nowrap',
                whiteSpace: wrapContent ? 'pre-wrap' : 'nowrap',
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
      const labelDetailsMode = meta.type.includes('Label') && ['content', 'cover or content'].includes(showCover)
      return (
        <Content
          fullWidth
          fullHeight
          {...rest}
          style={{
            padding: 10,
            ...style
          }}
          ref={mergedRef}
          onClickCapture={e => {
            if (gDrag) {
              e.stopPropagation()
            }
          }}
        >
          <Content
            ref={ref}
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
            flex
            column
            className={'light-hover bg-popover'}
            role={'group-item-content'}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 3,
              transition: 'background 0.25s ease',
              cursor: 'pointer',
              background: gDrag || isEditing ? Colors.Background.Popover : isSelected ? Colors.Common.SelectColorTransparent : undefined,
              boxShadow: Colors.Background.BorderBoxShadow
            }}
          >
            <Content
              flex
              style={{
                position: 'absolute',
                right: 4,
                top: 4,
                zIndex: 20,
                opacity: isIn ? 1 : 0,
                transition: 'opacity 0.2s ease',
                background: Colors.Background.Popover,
                boxShadow: Colors.Background.BorderBoxShadow,
                borderRadius: 4,
                overflow: 'hidden'
              }}
            >
              <Icon
                name={isEditing ? 'park-save' : 'park-edit'}
                size={14}
                className={ClassName.flatButton(0, '5px')}
                onClick={e => {
                  setIsEditing(!isEditing)
                }}
              />
              <Icon
                name={'park-more'}
                size={20}
                className={ClassName.flatButton(0, '2px')}
                onClick={e => {
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
              />
            </Content>
            {renderIndicator()}
            {(labelDetailsMode || showCover === 'content' || thumbnailMode || (showCover === 'cover or content' && !meta.coverImgSrc)) && (
              <ContentDisplayer
                onClick={e => {
                  if (isEditing) return
                  instance.openObject?.(meta.id, rowDetails.rowId)
                }}
                thumbnailMode={thumbnailMode}
                hideCoverIfEmpty={hideCoverIfEmpty}
                metaId={meta.id}
              />
            )}
            {(showCover === 'cover' || (showCover === 'cover or content' && meta.coverImgSrc)) &&
              !labelDetailsMode &&
              !thumbnailMode &&
              (isEditing || !hideCoverIfEmpty || meta.coverImgSrc) && (
                <ImageItem
                  isEditing={isEditing}
                  value={meta.coverImgSrc}
                  onChange={v => {
                    instance.metaOps?.updateMeta({ id: meta.id, coverImgSrc: v })
                  }}
                  onClick={e => {
                    if (isEditing) return
                    if (!meta.coverImgSrc) {
                      e.preventDefault()
                      instance.openObject?.(meta.id, rowDetails.rowId)
                    }
                  }}
                />
              )}
            {(!thumbnailMode || (thumbnailMode && isEditing)) && (
              <div
                style={{ width: '100%', flex: 1, paddingTop: labelDetailsMode && !isEditing ? '6px' : 0 }}
                onClick={e => {
                  if (isEditing) return
                  if (e.target instanceof HTMLElement && e.target.closest('[role="prop"]')) return
                  if (e.currentTarget.contains(e.target)) {
                    instance.openObject?.(meta.id, rowDetails.rowId)
                  }
                }}
              >
                {isEditing ? (
                  <AutosizeTextarea
                    disabled={!isEditing}
                    onBlur={e => {
                      instance.metaOps?.updateMeta({ id: meta.id, name: e.target.innerText })
                    }}
                    autoFocus
                    value={meta?.name || ''}
                    style={{
                      padding: '8px 10px 2px',
                      display: 'block',
                      width: '100%',
                      fontWeight: 500,
                      fontSize: 14,
                      color: meta.name ? undefined : Colors.Font.Transparent,
                      overflow: 'hidden',
                      cursor: isEditing ? 'text' : 'pointer',
                      pointerEvents: isEditing ? 'auto' : 'none'
                    }}
                    placeholder={t('general.Type a name')}
                  ></AutosizeTextarea>
                ) : labelDetailsMode ? null : (
                  <div
                    style={{
                      padding: '8px 10px 2px',
                      display: 'block',
                      width: '100%',
                      fontWeight: 500,
                      color: meta.name ? undefined : Colors.Font.Transparent,
                      overflow: 'hidden',
                      resize: 'none',
                      cursor: 'pointer',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      fontSize: 14,
                      pointerEvents: 'none'
                    }}
                  >
                    {meta.name}
                  </div>
                )}
                <div
                  style={{
                    overflow: 'hidden',
                    paddingBottom: 6
                  }}
                >
                  {visibleProps?.map(i => <Fragment key={i.id}>{propRender(i)}</Fragment>)}
                </div>
              </div>
            )}
          </Content>
        </Content>
      )
    }
  )
)
