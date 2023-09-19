import { useEffect, useState } from 'react'
import { CheckBox, Content, VirtualList } from '@/components'
import InnerFilterer from '@/core/group/InnerFilterer'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { MetaStore, ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import { transformFilterGroupToFilterArray } from '@/core/database/filter/useBetterFilter'
import { getAllMetasInTable } from '@/core/group/actions/search'
import { useRenderObject } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import Id from '@/utils/id'

type QueryResult = {
  metaId: number
  selected: boolean
}
const QueryPanel = ({ groupId, onClose }: { groupId: number; onClose: VoidFunction }) => {
  const [queryResult, setQueryResult] = useState<QueryResult[]>([])
  const groupData = ObjectStore('group').useValue(groupId)
  useEffect(() => {
    const existedMetas = getAllMetasInTable(groupData?.value)
    if (groupData?.rootFilterGroup.rules) {
      const filterFunc = transformFilterGroupToFilterArray(groupData.rootFilterGroup)
      if (filterFunc !== undefined) {
        const allObjects = Array.from(MetaStore.getMetaObjectsMap().values())
        const leftObjects = allObjects.filter(filterFunc)
        const finalObjects = leftObjects.filter(i => !existedMetas.has(i.id))
        setQueryResult(finalObjects.map(i => ({ metaId: i.id, selected: false })))
      }
    } else {
      const allObjects = Array.from(MetaStore.getMetaObjectsMap().values())
      const finalObjects = allObjects.filter(i => !existedMetas.has(i.id))
      setQueryResult(finalObjects.map(i => ({ metaId: i.id, selected: false })))
    }
  }, [groupData?.rootFilterGroup])
  return (
    <Content flex column>
      <Content flex column gap={8} style={{ lineHeight: 1, marginBottom: 10 }}>
        <div className={ClassName.title(FontSize['14px'])}>筛选实体库</div>
        <div className={ClassName.description(FontSize['12px'])}>筛选器会自动将符合条件的实体添加到组中</div>
      </Content>
      <InnerFilterer groupId={groupId} />
      <Content flex>
        <div>{queryResult?.length}实体</div>
        <div
          onClick={() =>
            setQueryResult(s =>
              s.map(i => ({
                ...i,
                selected: true
              }))
            )
          }
        >
          select all
        </div>
        <div
          onClick={() =>
            setQueryResult(s =>
              s.map(i => ({
                ...i,
                selected: false
              }))
            )
          }
        >
          deselect all
        </div>
        <div
          onClick={() => {
            console.log(groupData)
            if (!groupData) return
            const selected = queryResult.filter(i => i.selected)
            ObjectStore('group').updateOne({
              id: groupId,
              value: [
                ...(groupData.value || []),
                ...selected.map(i => ({
                  type: 'metaObject',
                  id: i.metaId,
                  rowId: Id.getId()
                }))
              ]
            })
            onClose()
          }}
        >
          add
        </div>
      </Content>
      <VirtualList
        items={queryResult || []}
        renderItem={(item, idx) => (
          <ResultItem
            metaId={item.metaId}
            selected={item.selected}
            onSelect={() => {
              setQueryResult(s => {
                s[idx].selected = !s[idx].selected
                return [...s]
              })
            }}
          />
        )}
        estimateSize={40}
      ></VirtualList>
    </Content>
  )
}

const ResultItem = ({ selected, onSelect, metaId }: { selected: boolean; onSelect: () => void; metaId: number; onAdd: VoidFunction }) => {
  const metaObject = MetaStore.useValue(metaId)

  return (
    <Content flex gap={6}>
      <CheckBox checked={selected} onChange={v => onSelect(v)} />
      <div>{Rendevoz.Utils.Meta.getTypeName(metaObject?.type)}</div>
      <div>{metaObject?.name}</div>
    </Content>
  )
}
export default QueryPanel
