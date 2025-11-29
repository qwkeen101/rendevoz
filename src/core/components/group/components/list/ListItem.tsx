import { MetaGroupChild, MetaGroupProperty } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
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
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import renderGroupItemProp from '@/core/components/group/components/basic/renderGroupItemProp'
const moveCursorToEnd = node => {
  const range = document.createRange()
  const selection = window.getSelection()
  range.setStart(node, node.childNodes.length)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

export default memo(
  ({ rowDetails, visibleProps, showDeleted }: { rowDetails: MetaGroupChild; showDeleted?: boolean; visibleProps?: any }) => {
    const meta = MetaStore.useValue(rowDetails.id)
    const icon = meta && Global.utils.getIcon(meta.type)
    const { ref: bodyRef, isIn } = useIsIn()
    const { checkIntersect, isSelected, clearSelectState, select, scrollIntoView } = useSelectCheck(bodyRef, rowDetails)
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
    const name = Global.metaOps.getMetaName(meta)
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
          text.textContent = name || t(trans.Unnamed)
        }
      }
    }, [isEditing, meta?.name, meta?.placeholderName])

    if (!meta) return null
    if (!showDeleted && meta.deleted) return null
    const propRender = (prop: MetaGroupProperty) => {
      const realProp = MetaStore.property.getPropDetails(prop.id)
      const rendered = renderGroupItemProp({
        prop,
        meta,
        instance,
        isEditing
      })

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
            className={classnames(
              ClassName.flatButton(3, '4px'),
              'w-fit break-all whitespace-nowrap empty:hidden overflow-hidden flex-nowrap shrink-0'
            )}
            style={{
              transition: 'background 0.15s ease',
              fontSize: 12,
              lineHeight: '18px',
              marginLeft: 2,
              maxWidth: '20%'
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
            transition: 'background 0.15s ease, box-shadow 0.15s ease',
            cursor: isEditing ? 'text' : globalIsDragging ? 'grabbing' : 'pointer',
            boxShadow: isEditing ? Colors.Common.FocusBoxShadow : undefined,
            background: globalIsDragging || isEditing ? 'transparent' : isSelected ? Colors.Common.SelectColorTransparentLight : undefined
          }}
        >
          {meta.coverImgSrc ? (
            <img
              src={meta.coverImgSrc}
              className={'size-8 rounded-md object-cover'}
              onClick={() => {
                Global.commonOps?.previewImage?.(meta?.coverImgSrc)
              }}
            />
          ) : icon ? (
            <Icon size={18} name={icon} className={'transparent-font'} />
          ) : null}
          <div
            ref={inputRef}
            style={{
              pointerEvents: isEditing ? 'auto' : 'none',
              maxWidth: 'calc(100% - 64px)',
              marginLeft: 10,
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
            className={classnames(!meta?.name && !isEditing && 'super-transparent-font', 'line-clamp-1 font-medium overflow-hidden shrink')}
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
              className={'square-button-small'}
              style={{
                flexShrink: 0,
                opacity: isIn && !isEditing ? 1 : 0,
                marginRight: 'auto',
                marginLeft: 6
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
