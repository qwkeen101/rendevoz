import { MetaGroup, MetaGroupChild, MetaGroupProperty } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Icon, Tooltip, AutosizeTextarea } from '@/components'
import ImageItem from '@/core/components/group/components/gallery/items/ImageItem'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useIsIn, useMergedRef } from '@/hooks'
import { ClassName } from 'rendevoz'
import useDragInGallery from '@/core/components/group/hooks/drag/useDragInGallery'
import React, { CSSProperties, forwardRef, Fragment, memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import useSelectCheck from '@/core/components/group/hooks/select/useSelectCheck'
import { Colors, Icons } from '@/consts'
import useItemDrag from '@/core/components/group/hooks/drag/useItemDrag'
import { useGlobalIsDragging } from '@/core'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import ContentDisplayer from '@/core/components/group/components/gallery/items/FixedHeightContentDisplayer'
import renderGroupItemProp from '@/core/components/group/components/basic/renderGroupItemProp'
import trans from '@/consts/trans'

const PropButtonClass = ClassName.flatButton(4, '4px')
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

      const handleClick = useCallback(() => {
        if (isEditing) return
        instance.openObject?.(meta.id, rowDetails.rowId)
      }, [isEditing])

      const { t } = useTranslation()

      useItemDrag(bodyRef, rowDetails, {
        clickDrag: true,
        draggable: !isEditing,
        dragTriggerRef: ref
      })
      if (!meta) return null
      if (!showDeleted && meta.deleted) return null
      const propRender = (prop: MetaGroupProperty) => {
        const realProp = MetaStore.property.getPropDetails(prop.id)
        const rendered = renderGroupItemProp({
          meta,
          instance,
          prop,
          isEditing
        })

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
                className={PropButtonClass}
                style={{
                  width: 'auto',
                  margin: '0px 6px',
                  transition: 'background 0.15s ease',
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
                    className={'transparent-font'}
                    style={{
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
              onClick={e => e.stopPropagation()}
              className={classnames(PropButtonClass, 'empty:hidden')}
              style={{
                width: 'fit-content',
                maxWidth: '400px',
                margin: '0px 6px',
                overflow: 'hidden',
                transition: 'background 0.15s ease',
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
        <div
          className={'w-full h-full relative'}
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
          {renderIndicator()}
          <div
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
            onClick={handleClick}
            className={classnames(
              'overflow-hidden flex flex-col relative w-full cursor-pointer transition-colors rounded-xl bg-popover',
              !thumbnailMode && 'light-hover border-box-shadow'
            )}
            role={'group-item-content'}
            style={{
              height: thumbnailMode && !meta.type.includes('Label') ? 'auto' : '100%',
              background: gDrag || isEditing ? Colors.Background.Popover : isSelected ? Colors.Common.SelectColorTransparentLight : undefined
            }}
          >
            {(labelDetailsMode || showCover === 'content' || thumbnailMode || (showCover === 'cover or content' && !meta.coverImgSrc)) && (
              <ContentDisplayer thumbnailMode={thumbnailMode} hideCoverIfEmpty={hideCoverIfEmpty} metaId={meta.id} />
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
                      e.stopPropagation()
                      e.preventDefault()
                      instance.openObject?.(meta.id, rowDetails.rowId)
                    }
                  }}
                />
              )}
            {!thumbnailMode && (
              <>
                {labelDetailsMode ? null : isEditing ? (
                  <AutosizeTextarea
                    onBlur={e => {
                      instance.metaOps?.updateMeta({ id: meta.id, name: e.target.innerText })
                    }}
                    autoFocus
                    value={meta?.name || ''}
                    style={{
                      padding: '8px 10px 2px',
                      display: 'block',
                      color: meta.name ? undefined : Colors.Font.SuperTransparent,
                      cursor: isEditing ? 'text' : 'pointer',
                      pointerEvents: isEditing ? 'auto' : 'none'
                    }}
                    placeholder={t('general.Type a name')}
                    className={'border-top font-medium overflow-hidden w-full first:!border-0'}
                  ></AutosizeTextarea>
                ) : (
                  <div
                    className={'border-top w-full font-medium cursor-pointer first:!border-0'}
                    style={{
                      padding: '8px 10px 2px',
                      display: 'block',
                      color: meta.name ? undefined : Colors.Font.SuperTransparent,
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      pointerEvents: 'none'
                    }}
                  >
                    {meta.name || t(trans.Unnamed)}
                  </div>
                )}
                <div
                  style={{
                    overflow: 'hidden',
                    paddingBottom: 6,
                    paddingTop: labelDetailsMode ? 6 : undefined
                  }}
                  className={classnames(labelDetailsMode && 'border-top empty:hidden')}
                >
                  {visibleProps?.map(i => <Fragment key={i.id}>{propRender(i)}</Fragment>)}
                </div>
              </>
            )}
            {!thumbnailMode && (
              <div
                onClick={e => e.stopPropagation()}
                className={'border-box-shadow flex bg-popover absolute transition-opacity overflow-hidden rounded-md'}
                style={{
                  right: 6,
                  top: 6,
                  zIndex: 20,
                  opacity: isIn ? 1 : 0
                }}
              >
                <Icon
                  name={isEditing ? 'park-save' : 'park-edit'}
                  size={14}
                  className={ClassName.flatButton(0, '5px')}
                  onClick={() => {
                    setIsEditing(!isEditing)
                  }}
                />
                <Icon
                  name={Icons.More}
                  size={14}
                  className={ClassName.flatButton(0, '5px')}
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
              </div>
            )}
          </div>
        </div>
      )
    }
  )
)
