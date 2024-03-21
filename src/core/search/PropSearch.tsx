import { ISearchResult } from '@/api/textSearch/types'
import { useEffect, useState, memo } from 'react'
import { Content, Icon, VirtualList } from '@/components'
import { ClassName } from 'rendevoz'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { Colors } from '@/consts'
import { GlobalInstance } from '@/hooks'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import Tag from '@/core/object/ObjectTag'
import { Rendevoz } from '@/core/rendevoz'

export default memo(({ results, onNumChange }: { results: ISearchResult; onNumChange?: (n: number) => void }) => {
  const [propState, setPropState] = useState<Record<number, ISearchResult>>({})
  useEffect(() => {
    const res: Record<number, number[]> = {}
    const metaIdToResMap = new Map(results.map(i => [i.metaId, i]))
    Array.from(metaIdToResMap.keys()).forEach(id => {
      const m = MetaStore.getCachedMetaObject(id)
      if (m && !m.deleted) {
        if (m.properties) {
          Object.keys(m.properties).forEach(k => {
            const t = Number(k)
            if (m.properties![k].value !== undefined) {
              res[t] = res[t] ? [...res[t], id] : [id]
            }
          })
        }
      }
    })
    const propStore = globalStore.get(ObjectStore('metaProp').objectMapAtom)
    Object.keys(res).forEach(id => {
      const p = propStore.get(Number(id))
      if (!p || p.deleted) {
        delete res[Number(id)]
      }
    })
    onNumChange?.(Object.keys(res).length)
    setPropState(
      Object.fromEntries(Object.entries(res).map(i => [i[0], i[1].map(o => metaIdToResMap.get(o)).filter(i => i) as ISearchResult]))
    )
  }, [results])

  return (
    <VirtualList
      estimateSize={100}
      items={Object.entries(propState)}
      renderItem={i => <ParentChildItem items={i[1]} propId={Number(i[0])} key={i[0]} />}
      style={{
        padding: '6px',
        width: '100%',
        height: '100%'
      }}
    ></VirtualList>
  )
})

const ParentChildItem = ({ items, propId }: { items: ISearchResult; propId: number }) => {
  const [toggled, setToggled] = useState(false)
  const prop = ObjectStore('metaProp').useValue(propId)
  if (items.length === 0 || !prop) return null
  return (
    <Content flex column>
      <Content
        className={ClassName.flatButton()}
        style={{
          padding: 4
        }}
        flex
        onClick={() => {
          Rendevoz.Actions.Open.Group.openPropGroup(propId)
          GlobalInstance.searchOps?.closeSearchPanel()
        }}
        alignItems={'center'}
      >
        <Icon
          size={18}
          onClick={e => {
            setToggled(!toggled)
            e.stopPropagation()
          }}
          style={{
            marginRight: 6,
            transition: 'all 0.16s ease',
            transform: toggled ? undefined : 'rotate(90deg)'
          }}
          name={'park-right'}
          className={ClassName.flatButton(4, '3px')}
        />
        <Content flex alignItems={'center'} className={'font-size-14'} gap={8}>
          <Icon name={prop?.icon} />
          <div>{prop.name}</div>
        </Content>
        <div style={{ marginLeft: 4 }} className={'transparent-font font-size-12'}>
          ({items.length})
        </div>
      </Content>
      {!toggled && (
        <Content
          flex
          column
          style={{
            paddingLeft: '30px'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 15,
              top: 0,
              height: '100%',
              width: 1,
              background: Colors.Background.Border
            }}
          ></div>
          {items.map(i => (
            <SearchItemRenderer
              style={{
                background: undefined
              }}
              onClick={() => {
                GlobalInstance.searchOps?.closeSearchPanel()
                GlobalInstance.layoutOps?.openObject(i.metaId)
              }}
              selected={false}
              hit={i}
              key={i.id}
            />
          ))}
        </Content>
      )}
    </Content>
  )
}
