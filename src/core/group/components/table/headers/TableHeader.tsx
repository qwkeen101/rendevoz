import { useAtom, useSetAtom } from 'jotai'
import { TableStateAtom } from '@/core/group/hooks/useTableState'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Reorder } from 'framer-motion'
import { Colors } from '@/consts'
import GroupHeaderItem from '@/core/group/components/table/headers/HeaderItem'
import { Content } from '@/components'
import { GroupStateAtom } from '@/core/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import produce from 'immer'
import { useIsIn, useSelectAtomValue } from '@/hooks'

const GroupTableHeader = memo(() => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const unToggledSelectedCount = useSelectAtomValue(GroupStateAtom, s => s.unToggledSelectedCount)
  const unToggledValueCount = useSelectAtomValue(GroupStateAtom, s => s.unToggledValueCount)
  const selectedCount = useSelectAtomValue(GroupStateAtom, s => s.selectedCount)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const allHeaders = currentView?.options.properties || []
  const visibleHeaders = currentView?.options.properties?.filter(i => i.visible) || []
  const instance = useGroupInstance()
  const [innerItems, setInnerItems] = useState(visibleHeaders)
  const { ref: checkboxRef, isIn } = useIsIn()
  const handleSelectVisibleItems = () => {
    const elements = instance.valueOps?.getVisibleValues()
    if (elements?.length) {
      const allSelected = unToggledSelectedCount === unToggledValueCount
      // 如果全选，清除
      if (allSelected) {
        instance.selectOps?.clearAllSelect()
        return
      }
      if (unToggledSelectedCount >= 0 && unToggledSelectedCount < unToggledValueCount) {
        instance.selectOps?.selectAll()
        return
      }
    } else {
      instance.selectOps?.clearAllSelect()
    }
  }
  console.log({
    selectedCount,
    unToggledSelectedCount,
    unToggledValueCount
  })
  useLayoutEffect(() => {
    setInnerItems(visibleHeaders)
  }, [currentView?.options.properties])
  useLayoutEffect(() => {
    if (!checkboxRef.current) return
    if (unToggledSelectedCount > 0 && unToggledSelectedCount < unToggledValueCount) {
      checkboxRef.current.indeterminate = true
    } else {
      checkboxRef.current.indeterminate = false
    }
  }, [unToggledSelectedCount, unToggledValueCount])

  return (
    <Content
      flex
      alignItems={'center'}
      style={{
        position: 'sticky',
        top: 0,
        background: Colors.Background.Global,
        zIndex: 10,
        borderBottom: `1px solid ${Colors.Background.Border}`,
        borderTop: `1px solid ${Colors.Background.Border}`
      }}
    >
      <input
        ref={checkboxRef}
        onClick={e => {
          handleSelectVisibleItems()
        }}
        style={{
          margin: '0px 9px',
          width: 14,
          cursor: 'pointer',
          height: 14,
          position: 'sticky',
          transition: 'opacity 0.2s ease',
          left: 8,
          opacity: isIn || selectedCount > 0 ? 1 : 0,
          zIndex: 20
        }}
        checked={selectedCount > 0 && unToggledSelectedCount === unToggledValueCount}
        type={'checkbox'}
      />
      <Reorder.Group
        axis="x"
        as={'div'}
        layoutScroll={true}
        style={{ display: 'flex' }}
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
              instance.updateCurrentView?.(s => ({
                ...s,
                options: {
                  ...s.options,
                  properties: [...innerItems, ...(allHeaders.filter(i => i.visible === false) || [])]
                }
              }))
            }}
            onResize={newItem => {
              const idx = visibleHeaders.findIndex(i => i.name === newItem.name)
              const newVisibleHeaders = [...visibleHeaders]
              newVisibleHeaders[idx] = newItem
              setGroupState(s => ({
                ...s,
                headerColumn: newVisibleHeaders.map(i => `${i.width + 1}px`).join(' '),
                tableWidth: newVisibleHeaders.reduce((prev, curr) => prev + curr.width, 0) + 35
              }))
            }}
            onResizeEnd={newItem => {
              const idx = allHeaders.findIndex(i => i.name === newItem.name)
              const newHeaders = produce(allHeaders, s => {
                s[idx] = newItem
              })
              instance.updateCurrentView?.(s => ({
                ...s,
                options: {
                  ...s.options,
                  properties: newHeaders
                }
              }))
            }}
          />
        ))}
      </Reorder.Group>
    </Content>
  )
})

export default GroupTableHeader
