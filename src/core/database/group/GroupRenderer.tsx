import { ObjectStore } from '@/stores'
import { MetaFilterGroup, MetaGroup, MetaGroupChild, MetaTableHeader } from '~/typings'
import { atom, useAtom, Provider } from 'jotai'
import { Content, Icon, Image, VirtualList } from '@/components'
import { useRenderObject } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Colors } from '@/consts'
import { Resizable } from 're-resizable'
import { TableStateAtom } from '@/core/database/group/hooks/useTableState'
import { TableBodyRenderer } from '@/core/database/group/RowRenderer'
import { useTableInstance } from '@/core/database/group/hooks/useTableInstance'
import { assignProperties } from '@/utils'
import useGroupFilter from '@/core/database/group/hooks/useGroupFilter'
import Id from '@/utils/id'

const tableRendererAtom = atom<{
  filter?: MetaFilterGroup
  sorter?: any
}>({})
export const GroupRenderer = ({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const allMetas = groupData && [...groupData.childrenMetaIds]
  const renderMode = groupData?.renderMode
  const afterFilter = groupData?.afterFilterValue
  const instance = useTableInstance()
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
  if (allMetas) {
    return <TableRenderer value={afterFilter || groupData?.value} />
  }
}

const ListRenderer = ({ metaIds }: { metaIds: number[] }) => {
  return (
    <Content flex column gap={6} style={{ height: '100%' }}>
      <VirtualList
        items={metaIds}
        estimateSize={20}
        style={{
          width: '100%',
          height: '100%'
        }}
        renderItem={i => <ListItem metaId={i} key={i} />}
      />
    </Content>
  )
}

const ListItem = ({ metaId }: { metaId: number }) => {
  const { renderTitle, metaObject } = useRenderObject({ metaObjectId: metaId })

  return (
    <Content flex style={{ margin: '3px 0px', width: '100%' }}>
      <Content flex gap={8} fullWidth>
        {metaObject?.coverImgSrc ? (
          <Image width={24} src={metaObject.coverImgSrc} style={{ borderRadius: 6 }} />
        ) : (
          <Icon size={16} name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject?.type)} containerStyle={{ margin: '0px 4px' }} />
        )}
        {renderTitle({
          ellipsisLine: 1
        })}
      </Content>
    </Content>
  )
}

const TableRenderer = ({ value }: { value: MetaGroupChild[] }) => {
  return (
    <Content flex column style={{ height: 0, flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
      <TableHeaderRenderer />
      <TableBodyRenderer value={value} />
    </Content>
  )
}

const TableHeaderRenderer = () => {
  const [tableState, setTableState] = useAtom(TableStateAtom)
  const [innerItems, setInnerItems] = useState(tableState.headers)
  return (
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
        <ReorderHeaderItem
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
  )
}

const ReorderHeaderItem = ({
  item,
  onDragEnd,
  onResizeEnd
}: {
  item: MetaTableHeader
  onDragEnd: VoidFunction
  onResizeEnd: (currItem: MetaTableHeader) => void
}) => {
  const controls = useDragControls()
  return (
    <Reorder.Item
      onDragEnd={onDragEnd}
      dragListener={false}
      dragControls={controls}
      as={'div'}
      value={item}
      style={{
        borderRight: `1px solid ${Colors.Background.Border}`,
        color: Colors.Font.Description,
        fontWeight: 600,
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Resizable
        enable={{ right: true }}
        style={{
          padding: '2px 8px'
        }}
        onResize={(event, direction, elementRef, delta) => {
          const newItem = { ...item, width: elementRef.clientWidth }
          onResizeEnd(newItem)
        }}
        defaultSize={{ width: item.width, height: '100%' }}
        size={{ width: item.width, height: '100%' }}
      >
        <Content
          flex
          gap={6}
          onPointerDown={e => {
            controls.start(e)
          }}
        >
          {item.icon && <Icon name={item.icon} />}
          {item.display()}
        </Content>
      </Resizable>
    </Reorder.Item>
  )
}
