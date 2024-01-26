import { useSetAtom } from 'jotai'
import { memo, ReactElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Reorder } from 'framer-motion'
import { Colors } from '@/consts'
import GroupHeaderItem from '@/core/components/group/components/table/headers/HeaderItem'
import { Content, IconWithPopover } from '@/components'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import produce from 'immer'
import { useIsIn, useSelectAtomValue } from '@/hooks'
import NewPropertyMenu from '@/core/object/renderer/properties/NewPropertyMenu'
import { MetaGroupProperty } from '~/typings'
import { ClassName } from 'rendevoz'

const GroupTableHeader = memo(({ extraNode, visible, grouperId }: { extraNode?: ReactElement; visible?: boolean; grouperId?: number }) => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const currentGrouper = useSelectAtomValue(GroupStateAtom, s => s.groups?.find(i => i.id === grouperId))
  const unToggledSelectedCount = useSelectAtomValue(GroupStateAtom, s => s.unToggledSelectedCount)
  const unToggledValueCount = useSelectAtomValue(GroupStateAtom, s => s.unToggledValueCount)
  const unToggledSelectedRowIds = useSelectAtomValue(GroupStateAtom, s => s.unToggledSelectedRowIds)
  const instance = useGroupInstance()
  const visibleHeaders = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)

  const [innerItems, setInnerItems] = useState<(MetaGroupProperty & { width: number })[]>(visibleHeaders ?? [])
  const { ref: checkboxRef, isIn } = useIsIn()
  const handleSelectVisibleItems = () => {
    if (currentGrouper) {
      const allValues = currentGrouper.values
      if (grouperAllSelected) {
        allValues.forEach(i => {
          instance.selectOps?.deselectItem(i.tempRowId || i.rowId)
        })
      } else {
        allValues.forEach(i => {
          instance.selectOps?.selectItem(i.tempRowId || i.rowId)
        })
      }
    } else {
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
  }
  useLayoutEffect(() => {
    if (visibleHeaders) {
      setInnerItems(visibleHeaders)
    }
  }, [visibleHeaders])
  useLayoutEffect(() => {
    if (!checkboxRef.current) return
    if (currentGrouper) {
      const allValues = currentGrouper.values
      let selected = 0
      allValues.forEach(v => {
        if (unToggledSelectedRowIds?.has(v.tempRowId || v.rowId)) {
          selected += 1
        }
      })
      if (selected > 0 && selected < allValues.length) {
        checkboxRef.current.indeterminate = true
      } else {
        checkboxRef.current.indeterminate = false
      }
    } else {
      if (unToggledSelectedCount > 0 && unToggledSelectedCount < unToggledValueCount) {
        checkboxRef.current.indeterminate = true
      } else {
        checkboxRef.current.indeterminate = false
      }
    }
  }, [unToggledSelectedCount, unToggledValueCount, currentGrouper, unToggledSelectedRowIds])

  const hK = useMemo(() => visibleHeaders.map(i => i.id).join(''), [visibleHeaders])
  const isResizing = useRef(false)
  const [isReorder, setIsReorder] = useState(false)
  const reorderRef = useRef<HTMLDivElement>(null)
  const { grouperHasSelected, grouperAllSelected } = useMemo(() => {
    let grouperHasSelected = false,
      grouperAllSelected = false,
      selectedCount = 0
    currentGrouper?.values.forEach(v => {
      if (unToggledSelectedRowIds?.has(v.tempRowId || v.rowId)) {
        grouperHasSelected = true
        selectedCount += 1
      }
    })
    if (selectedCount === currentGrouper?.values.length) {
      grouperAllSelected = true
    }
    return {
      grouperHasSelected,
      grouperAllSelected
    }
  }, [currentGrouper, unToggledSelectedRowIds])
  return (
    <Content
      flex
      column
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: Colors.Background.Global
      }}
    >
      {extraNode}
      {visible && (
        <Content
          role={'table-wrapper'}
          flex
          alignItems={'center'}
          style={{
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
              opacity: isIn || (currentGrouper ? grouperHasSelected : unToggledSelectedCount > 0) ? 1 : 0,
              zIndex: 20
            }}
            checked={currentGrouper ? grouperAllSelected : unToggledSelectedCount > 0 && unToggledSelectedCount === unToggledValueCount}
            type={'checkbox'}
          />
          <Reorder.Group
            ref={reorderRef}
            axis="x"
            as={'div'}
            style={{ display: 'flex' }}
            values={innerItems}
            onReorder={items => {
              console.log(items, isResizing.current)
              if (isResizing.current) return
              setInnerItems(items)
            }}
          >
            {innerItems?.map((i, idx) => (
              <GroupHeaderItem
                onResizeStart={() => {
                  isResizing.current = true
                }}
                onDragStart={() => {
                  setIsReorder(true)
                }}
                item={i}
                constrainRef={reorderRef}
                key={`${i.id}_${hK}`}
                isReorder={isReorder}
                onDragEnd={() => {
                  setIsReorder(false)
                  const currProps = instance.getCurrentView?.()?.options.properties
                  if (currProps) {
                    const newProps = produce(currProps, draft => {
                      innerItems.forEach((i, idx) => {
                        draft[i.id].order = idx
                      })
                    })
                    instance.updateCurrentView?.(s => ({
                      ...s,
                      options: {
                        ...s.options,
                        properties: newProps
                      }
                    }))
                  }
                }}
                onResize={newItem => {
                  if (!visibleHeaders) return
                  const idx = visibleHeaders.findIndex(i => i.id === newItem.id)
                  const newVisibleHeaders = [...visibleHeaders]
                  newVisibleHeaders[idx] = newItem
                  setInnerItems(
                    produce(innerItems, s => {
                      s[idx] = newItem
                    })
                  )
                  setGroupState(s => ({
                    ...s,
                    headerColumn: newVisibleHeaders.map(i => `${i.width + 1}px`).join(' '),
                    tableWidth: newVisibleHeaders.reduce((prev, curr) => prev + curr.width, 0) + 35
                  }))
                }}
                onResizeEnd={newItem => {
                  instance.viewOps?.updateProperty(newItem.id, {
                    width: newItem.width
                  })
                  setTimeout(() => {
                    isResizing.current = false
                  }, 200)
                }}
              />
            ))}
          </Reorder.Group>
          <IconWithPopover
            padding={4}
            className={ClassName.flatButton(0, '8px')}
            style={{
              color: Colors.Font.Transparent
            }}
            size={16}
            placement={['bottom']}
            renderOnParent={false}
            content={setV => (
              <NewPropertyMenu
                onAddProp={p => {
                  instance.viewOps?.addNewProperty(p)
                }}
                onClose={() => setV(false)}
              />
            )}
            name={'park-plus'}
          />
        </Content>
      )}
    </Content>
  )
})

export default GroupTableHeader
