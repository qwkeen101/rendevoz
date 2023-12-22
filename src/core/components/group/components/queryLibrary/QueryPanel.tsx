import { useEffect, useRef, useState } from 'react'
import { CheckBox, Content, Switch, VirtualList } from '@/components'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { MetaStore, ObjectStore } from '@/api/stores'
import { transformFilterGroupToFilterArray } from '@/core/object/filter/useBetterFilter'
import { getAllMetasInTable } from '@/core/components/group/actions/search'
import { useRenderObject } from '@/core'
import Id from '@/utils/id'
import { Colors } from '@/consts'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { useTranslation } from 'react-i18next'

type QueryResult = {
  metaId: number
  selected: boolean
}
const QueryPanel = ({ groupId, onClose }: { groupId: number; onClose: VoidFunction }) => {
  const [queryResult, setQueryResult] = useState<QueryResult[]>([])
  const [queryRule, setQueryRule] = useState()
  const [showInGroup, setShowInGroup] = useState(false)
  const groupData = ObjectStore('group').useValue(groupId)
  const { t } = useTranslation()
  useEffect(() => {
    const existedMetas = getAllMetasInTable(groupData?.values)
    if (queryRule?.rules?.length) {
      const filterFunc = transformFilterGroupToFilterArray(queryRule)
      if (filterFunc !== undefined) {
        const allObjects = Array.from(MetaStore.getIndexedMetaObjects()?.undeletedMetaObjectsSet.values() || [])
        const leftObjects = allObjects.filter(filterFunc)
        const finalObjects = showInGroup ? leftObjects : leftObjects.filter(i => !existedMetas.has(i.id))
        setQueryResult(finalObjects.map(i => ({ metaId: i.id, selected: false })))
      }
    } else {
      const allObjects = Array.from(MetaStore.getIndexedMetaObjects()?.undeletedMetaObjectsSet.values() || [])
      const finalObjects = showInGroup ? allObjects : allObjects.filter(i => !existedMetas.has(i.id))
      setQueryResult(finalObjects.map(i => ({ metaId: i.id, selected: false })))
    }
  }, [queryRule, showInGroup])
  const selectRef = useRef<HTMLInputElement>(null)
  const selected = queryResult.filter(i => i.selected)
  useEffect(() => {
    const r = selectRef.current
    if (r) {
      if (selected.length > 0 && selected.length < queryResult.length) {
        r.indeterminate = true
      } else {
        r.indeterminate = false
      }
    }
  }, [selected.length])
  return (
    <Content flex column style={{ width: 700, height: 'auto', maxHeight: '70vh', borderRadius: 12 }}>
      <Content flex column style={{ padding: 24, paddingBottom: 6 }}>
        <Content flex column gap={12} style={{ lineHeight: 1, marginBottom: 16 }}>
          <div className={ClassName.title(FontSize['14px'])}>{t('general.Filter and add objects into group')}</div>
          <Content
            flex
            gap={16}
            style={{
              color: Colors.Font.Transparent,
              fontSize: 13
            }}
            alignItems={'center'}
          >
            <div>{t('general.Hide objects in group')}</div>
            <Switch small value={!showInGroup} onChange={v => setShowInGroup(v)} />
          </Content>
        </Content>
        <BetterFilter root={queryRule} onChange={r => setQueryRule(r)} />
        {queryResult.length > 0 ? (
          <Content flex gap={12} style={{ fontWeight: 600, paddingTop: 12 }}>
            <input
              ref={selectRef}
              type={'checkbox'}
              style={{
                cursor: 'pointer'
              }}
              checked={selected.length === queryResult.length}
              onClick={() => {
                if (selected.length === queryResult.length) {
                  setQueryResult(s =>
                    s.map(i => ({
                      ...i,
                      selected: false
                    }))
                  )
                } else {
                  setQueryResult(s =>
                    s.map(i => ({
                      ...i,
                      selected: true
                    }))
                  )
                }
              }}
            />
            <div style={{ color: Colors.Common.SelectColor }}>{selected.length} Selected</div>
            {selected.length !== queryResult.length && (
              <div
                style={{
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setQueryResult(s =>
                    s.map(i => ({
                      ...i,
                      selected: true
                    }))
                  )
                }}
              >
                Select all
              </div>
            )}
            {queryResult.length > 0 && selected.length > 0 && (
              <div
                style={{
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  background: Colors.Common.SelectColor,
                  color: 'white',
                  padding: '0px 8px',
                  borderRadius: 4
                }}
                onClick={() => {
                  if (!groupData) return
                  const selected = queryResult.filter(i => i.selected)
                  ObjectStore('group').updateOne({
                    id: groupId,
                    values: [
                      ...(groupData.values || []),
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
                Add
              </div>
            )}
          </Content>
        ) : (
          <div
            style={{
              color: Colors.Font.Transparent,
              fontWeight: 600,
              marginTop: 12
            }}
          >
            No matching object found.
          </div>
        )}
      </Content>
      <VirtualList
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 20
        }}
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

const ResultItem = ({
  selected,
  onSelect,
  metaId
}: {
  selected: boolean
  onSelect: (value: boolean) => void
  metaId: number
  onAdd: VoidFunction
}) => {
  const metaObject = MetaStore.useValue(metaId)
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  if (!metaObject) return null
  return (
    <Content
      flex
      gap={12}
      style={{ width: '100', padding: '8px 0px', borderTop: `1px solid ${Colors.Background.Border}` }}
      alignItems={'center'}
    >
      <CheckBox checked={selected} onChange={v => onSelect(v)} />
      {metaObject.coverImgSrc && (
        <img src={metaObject.coverImgSrc} width={42} style={{ borderRadius: 4, objectFit: 'cover' }} height={42} />
      )}
      <Content>
        {renderInline({
          ellipsisLine: 1,
          containerStyle: { lineHeight: 1.2, fontSize: 14 },
          onClick: () => {
            onSelect(!selected)
          }
        })}
        {metaObject.description && (
          <div style={{ fontSize: 13, color: Colors.Font.Transparent }} className={ClassName.ellipsisFont(1)}>
            {metaObject.description}
          </div>
        )}
      </Content>
    </Content>
  )
}
export default QueryPanel
