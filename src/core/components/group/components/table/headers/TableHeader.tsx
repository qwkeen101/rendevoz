import { useSetAtom } from 'jotai'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

const GroupTableHeader = memo(() => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const unToggledSelectedCount = useSelectAtomValue(GroupStateAtom, s => s.unToggledSelectedCount)
  const unToggledValueCount = useSelectAtomValue(GroupStateAtom, s => s.unToggledValueCount)
  const selectedCount = useSelectAtomValue(GroupStateAtom, s => s.selectedCount)
  const instance = useGroupInstance()
  const visibleHeaders = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)

  const [innerItems, setInnerItems] = useState<(MetaGroupProperty & { width: number })[]>(visibleHeaders ?? [])
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

  useLayoutEffect(() => {
    if (visibleHeaders) {
      console.log(visibleHeaders)
      setInnerItems(visibleHeaders)
    }
  }, [visibleHeaders])
  useLayoutEffect(() => {
    if (!checkboxRef.current) return
    if (unToggledSelectedCount > 0 && unToggledSelectedCount < unToggledValueCount) {
      checkboxRef.current.indeterminate = true
    } else {
      checkboxRef.current.indeterminate = false
    }
  }, [unToggledSelectedCount, unToggledValueCount])

  const hK = useMemo(() => visibleHeaders.map(i => i.id).join(''), [visibleHeaders])

  const [isReorder, setIsReorder] = useState(false)
  const reorderRef = useRef<HTMLDivElement>(null)
  return (
    <Content
      role={'table-wrapper'}
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
        ref={reorderRef}
        axis="x"
        as={'div'}
        style={{ display: 'flex' }}
        values={innerItems}
        onReorder={items => {
          setInnerItems(items)
        }}
      >
        {innerItems?.map((i, idx) => (
          <GroupHeaderItem
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
              const idx = visibleHeaders.findIndex(i => i.name === newItem.name)
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
  )
})

export default GroupTableHeader
