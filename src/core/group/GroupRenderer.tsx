import { ObjectStore } from '@/stores'
import { MetaGroup, MetaGroupChild, MetaTableHeader } from '~/typings'
import { useAtom } from 'jotai'
import { Content, Icon, Image, VirtualList } from '@/components'
import { useRenderObject } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { useEffect, useRef, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Colors } from '@/consts'
import { Resizable } from 're-resizable'
import { TableStateAtom } from '@/core/group/hooks/useTableState'
import TableBodyRenderer from '@/core/group/components/table/TableWrapper'
import { useTableInstance } from '@/core/group/hooks/useTableInstance'
import { assignProperties } from '@/utils'
import useGroupFilter from '@/core/group/hooks/useGroupFilter'
import Id from '@/utils/id'
import useGroupSelect from '@/core/group/hooks/select/useGroupSelect'
import { createPortal } from 'react-dom'
import GroupTableHeader from '@/core/group/components/table/headers/TableHeader'

export const GroupRenderer = ({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const allMetas = groupData && [...groupData.childrenMetaIds]
  const renderMode = groupData?.renderMode
  const afterFilter = groupData?.afterFilterValue
  const instance = useTableInstance()
  const containerRef = useRef<HTMLDivElement>(null)
  assignProperties(instance, {
    getCurrentRows: () => groupData?.value || []
  })
  useGroupFilter(groupId)
  useEffect(() => {
    if (groupData?.value) {
      let update = false
      const newValue = groupData.value.map(i => {
        if (i.rowId) {
          return i
        } else {
          update = true
          return {
            ...i,
            rowId: Id.getId()
          }
        }
      })
      if (update) {
        ObjectStore('group').updateOne({ id: groupId, value: newValue })
      }
    }
  }, [groupData])
  // if (renderMode === 'list' && allMetas) {
  //   return <ListRenderer metaIds={allMetas} />
  // }
  if (allMetas && groupData?.value) {
    return (
      <Content ref={containerRef} flex column fullHeight>
        <TableRenderer value={afterFilter || groupData?.value} />
      </Content>
    )
  }
}

const TableRenderer = ({ value }: { value: MetaGroupChild[] }) => {
  return (
    <Content flex column style={{ height: 0, flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
      <GroupTableHeader />
      <TableBodyRenderer value={value} />
    </Content>
  )
}
