import { ISearchResult } from '@/api/textSearch/types'
import { useEffect, useState, memo } from 'react'
import { Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import Tag from '@/core/object/ObjectTag'
import classnames from 'classnames'

export default memo(({ results, onNumChange }: { results: ISearchResult; onNumChange?: (n: number) => void }) => {
  const [tagState, setTagState] = useState<Record<number, ISearchResult>>({})
  useEffect(() => {
    const res: Record<number, number[]> = {}
    const metaIdToResMap = new Map(results.map(i => [i.metaId, i]))
    Array.from(metaIdToResMap.keys()).forEach(id => {
      const m = MetaStore.getCachedMetaObject(id)
      if (m && !m.deleted) {
        m.tags?.forEach(t => {
          res[t] = res[t] ? [...res[t], id] : [id]
        })
      }
    })
    const tagStore = globalStore.get(ObjectStore('tag').objectMapAtom)
    Object.keys(res).forEach(id => {
      const tag = tagStore.get(Number(id))
      if (!tag || tag.deleted) {
        delete res[id]
      }
    })
    onNumChange?.(Object.keys(res).length)
    setTagState(
      Object.fromEntries(Object.entries(res).map(i => [i[0], i[1].map(o => metaIdToResMap.get(o)).filter(i => i) as ISearchResult]))
    )
  }, [results])

  return (
    <VirtualList
      style={{
        width: '100%',
        height: '100%',
        padding: 6
      }}
      estimateSize={100}
      items={Object.entries(tagState).sort((a, b) => b[1].length - a[1].length)}
      renderItem={i => <ParentChildItem items={i[1]} tagId={Number(i[0])} key={i[0]} />}
    ></VirtualList>
  )
})

const ParentChildItem = ({ items, tagId }: { items: ISearchResult; tagId: number }) => {
  const [toggled, setToggled] = useState(true)
  if (items.length === 0) return null
  return (
    <div className={'flex flex-col'}>
      <div
        className={'items-center flex button !p-1.5'}
        onClick={() => {
          Global.layoutOps?.openPage('tagGroup', { id: tagId })
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
        <Tag hideDelete small square tag={tagId} />
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
