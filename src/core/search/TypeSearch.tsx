import { ISearchResult } from '@/api/textSearch/types'
import { useEffect, useState, memo } from 'react'
import { Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { MetaStore } from '@/api/stores'
import classnames from 'classnames'

export default memo(({ results, onNumChange }: { results: ISearchResult; onNumChange?: (n: number) => void }) => {
  const [state, setState] = useState<Record<string, ISearchResult>>({})
  useEffect(() => {
    const res: Record<string, number[]> = {}
    const metaIdToResMap = new Map(results.map(i => [i.metaId, i]))
    Array.from(metaIdToResMap.keys()).forEach(id => {
      const m = MetaStore.getCachedMetaObject(id)
      if (m && !m.deleted) {
        res[m.type] = [...(res[m.type] || []), m.id]
      }
    })
    onNumChange?.(Object.keys(res).length)
    setState(Object.fromEntries(Object.entries(res).map(i => [i[0], i[1].map(o => metaIdToResMap.get(o)).filter(i => i) as ISearchResult])))
  }, [results])

  return (
    <VirtualList
      estimateSize={100}
      paddingEnd={100}
      items={Object.entries(state).sort((a, b) => b[1].length - a[1].length)}
      renderItem={i => <ParentChildItem items={i[1]} type={i[0]} />}
      style={{
        padding: '6px',
        width: '100%',
        height: '100%'
      }}
    ></VirtualList>
  )
})

const ParentChildItem = ({ items, type }: { items: ISearchResult; type: string }) => {
  const [toggled, setToggled] = useState(true)
  const icon = Global.utils.getIcon(type)
  if (items.length === 0) return null
  return (
    <div className={'flex flex-col'}>
      <div
        className={'button flex items-center font-medium !p-1.5'}
        onClick={() => {
          setToggled(!toggled)
        }}
      >
        <Icon size={18} className={classnames('p-1 mr-2 transition-transform', !toggled && 'rotate-90')} name={'park-right'} />
        <div className={'flex items-center gap-2'}>
          <Icon name={icon} />
          <div>{Global.utils.getTypeName(type)}</div>
        </div>
        <div className={'px-1 ml-2 text-sm rounded bg-border'}>{items.length}</div>
      </div>
      {!toggled && (
        <div className={'flex flex-col pl-8 relative'}>
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
