import React, { Fragment, memo, useEffect, useRef } from 'react'
import { EventProps } from 'react-big-calendar'
import { MetaStore } from '@/api/stores'
import { Content, Tooltip } from '@/components'
import { format } from 'date-fns'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaGroupChild, MetaGroupProperty } from '~/typings'
import useSelectCheck from '@/core/components/group/hooks/select/useSelectCheck'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import { selectAtom } from 'jotai/utils'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { isEqual } from 'lodash'
import { useAtomValue } from 'jotai'
import renderGroupItemProp from '@/core/components/group/components/basic/renderGroupItemProp'
import trans from '@/consts/trans'

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
  const propRender = (prop: MetaGroupProperty) => {
    const realProp = MetaStore.property.getPropDetails(prop.id)
    const rendered = renderGroupItemProp({
      prop,
      meta,
      instance
    })

    const tooltipContent = prop.type === 'basic' ? t(prop.display) : realProp?.name
    if (!rendered) {
      return null
    }
    return (
      <Tooltip content={tooltipContent} positions={['left']}>
        <div
          role={'prop'}
          className={'empty:hidden'}
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
      className={'light-hover primary-font transition-colors rounded-lg border'}
      style={{
        overflow: 'hidden',
        padding: '2px 6px'
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
          background: isSelected ? Colors.Common.SelectColorTransparentLight : undefined,
          transition: 'all 0.2s ease'
        }}
      ></div>
      <Content flex alignItems={'center'} gap={8} justifyContent={'space-between'}>
        <div className={'normal-font font-size-13 ellipsis-font-1'}>{Global.metaOps.getMetaName(meta) || t(trans.Unnamed)}</div>
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
