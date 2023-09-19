import { useAtom } from 'jotai'
import { TableStateAtom } from '@/core/group/hooks/useTableState'
import { useEffect, useRef, useState } from 'react'
import { Reorder } from 'framer-motion'
import { Colors } from '@/consts'
import GroupHeaderItem from '@/core/group/components/table/headers/HeaderItem'
import { Content } from '@/components'
import useGroupState from '@/core/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'

const GroupTableHeader = () => {
  const [groupState, setGroupState] = useGroupState()
  const [tableState, setTableState] = useAtom(TableStateAtom)
  const instance = useGroupInstance()
  const [innerItems, setInnerItems] = useState(tableState.headers)
  const checkboxRef = useRef<HTMLInputElement>(null)
  const handleSelectVisibleItems = () => {
    const elements = instance.valueOps?.getVisibleValues()
    if (elements?.length) {
      const allSelected = groupState.selectedCount === groupState.unToggledValueCount
      // 如果全选，清除
      if (allSelected) {
        instance.values.inViewRowFuncs.forEach(v => v.clearSelectState())
        instance.values.selectedRowIdSet.clear()
        setGroupState(s => ({ ...s, selectedCount: 0 }))
        return
      }
      if (groupState.selectedCount >= 0 && groupState.selectedCount < groupState.unToggledValueCount) {
        instance.values.inViewRowFuncs.forEach(v => v.select())
        elements.forEach(([e, p]) => {
          instance.values.selectedRowIdSet.add(e.rowId)
        })
        setGroupState(s => ({ ...s, selectedCount: elements.length }))
        return
      }
    } else {
      setGroupState(s => ({ ...s, selectedCount: 0 }))
    }
  }
  useEffect(() => {
    if (!checkboxRef.current) return
    console.log(groupState.selectedCount, groupState.unToggledValueCount)
    if (groupState.selectedCount > 0 && groupState.selectedCount < groupState.unToggledValueCount) {
      checkboxRef.current.indeterminate = true
    } else {
      checkboxRef.current.indeterminate = false
    }
  }, [groupState])
  return (
    <Content flex alignItems={'center'}>
      <input
        ref={checkboxRef}
        onClick={e => {
          handleSelectVisibleItems()
        }}
        checked={groupState.selectedCount > 0 && groupState.selectedCount === groupState.unToggledValueCount}
        type={'checkbox'}
      />
      <Reorder.Group
        axis="x"
        as={'div'}
        style={{ display: 'flex', borderBottom: `1px solid ${Colors.Background.Border}` }}
        values={innerItems}
        onReorder={items => {
          setInnerItems(items)
        }}
      >
        {innerItems.map((i, idx) => (
          <GroupHeaderItem
            item={i}
            key={i.name}
            onDragEnd={() => {
              setTableState(s => ({ ...s, headers: innerItems, headerColumn: innerItems.map(i => `${i.width + 1}px`).join(' ') }))
            }}
            onResizeEnd={newItem => {
              setInnerItems(items => {
                const idx = items.findIndex(i => i.name === newItem.name)
                items[idx] = newItem
                const newArr = [...items]
                setTableState(s => ({ ...s, headers: newArr, headerColumn: newArr.map(i => `${i.width + 1}px`).join(' ') }))
                return newArr
              })
            }}
          />
        ))}
      </Reorder.Group>
    </Content>
  )
}

export default GroupTableHeader
