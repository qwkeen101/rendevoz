import { ISearchResult } from '@/api/textSearch/types'
import { useEffect, useState, memo } from 'react'
import { Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import classnames from 'classnames'

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
      items={Object.entries(propState).sort((a, b) => b[1].length - a[1].length)}
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
  const [toggled, setToggled] = useState(true)
  const prop = ObjectStore('metaProp').useValue(propId)
  if (items.length === 0 || !prop) return null
  return (
    <div className={'flex flex-col'}>
      <div
        className={'button flex items-center font-medium !p-1.5'}
        onClick={() => {
          Global.layoutOps?.openPage('propGroup', { id: propId })
          Global.searchOps?.closeSearchPanel()
        }}
      >
        <Icon
          size={18}
          onClick={e => {
            setToggled(!toggled)
            e.stopPropagation()
          }}
          className={classnames('p-1 mr-2 transition-transform', !toggled && 'rotate-90')}
          name={'park-right'}
        />
        <div className={'flex items-center gap-2'}>
          <Icon name={prop?.icon} />
          <div>{prop.name}</div>
        </div>
        <div className={'px-1 ml-2 text-sm rounded bg-border'}>{items.length}</div>
      </div>
      {!toggled && (
        <div className={'flex flex-col relative pl-8'}>
          <div className={'absolute top-0 h-full border-right -translate-x-[1px] left-5'}></div>
          {items.map(i => (
            <SearchItemRenderer
              style={{
                background: undefined
              }}
              onClick={() => {
                Global.searchOps?.closeSearchPanel()
                Global.layoutOps?.openObject(i.metaId)
              }}
              selected={false}
              hit={i}
              key={i.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
