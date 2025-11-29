import { ISearchResult } from '@/api/textSearch/types'
import { useEffect, useState, memo } from 'react'
import { Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { MetaStore } from '@/api/stores'
import calculateContains from '@/core/object/objectList/calculateContains'
import gotoContainedObject from '@/core/object/gotoContainedObject'
import classnames from 'classnames'

export default memo(({ results, onNumChange }: { results: ISearchResult; onNumChange?: (n: number) => void }) => {
  const [state, setState] = useState<Map<ISearchResult[0], number[]>>(new Map())
  useEffect(() => {
    const action = async () => {
      const res: Record<number, number[]> = {}
      const metaIdToResMap = new Map(results.map(i => [i.metaId, i]))
      await Promise.all(
        Array.from(metaIdToResMap.keys()).map(async id => {
          const m = MetaStore.getCachedMetaObject(id)
          if (m && !m.deleted) {
            const contains = await calculateContains(m)
            if (contains?.length) {
              res[id] = contains.map(i => i.id)
            }
          }
        })
      )
      onNumChange?.(Object.values(res).flat().length)
      setState(new Map(Object.entries(res).map(i => [metaIdToResMap.get(Number(i[0]))!, i[1]])))
    }
    action()
  }, [results])
  return (
    <VirtualList
      estimateSize={100}
      paddingEnd={100}
      items={Array.from(state.entries()).sort((a, b) => b[1].length - a[1].length)}
      renderItem={i => <ParentChildItem parent={i[0]} items={i[1]} />}
      style={{
        padding: '6px',
        width: '100%',
        height: '100%'
      }}
    ></VirtualList>
  )
})

const ParentChildItem = ({ items, parent }: { items: number[]; parent: ISearchResult[0] }) => {
  const [toggled, setToggled] = useState(true)
  if (items.length === 0) return null
  return (
    <div className={'flex flex-col'}>
      <div className={'button flex items-center !p-1.5'}>
        <Icon
          size={18}
          onClick={e => {
            setToggled(!toggled)
            e.stopPropagation()
          }}
          className={classnames('p-1 transition-transform', !toggled && 'rotate-90')}
          name={'park-right'}
        />
        <SearchItemRenderer
          onClick={() => {
            Global.searchOps?.closeSearchPanel()
            Global.layoutOps?.openObject(parent.metaId)
          }}
          selected={false}
          style={{
            padding: 0
          }}
          hit={parent}
          size={items.length}
        />
      </div>
      {!toggled && (
        <div className={'flex flex-col relative pl-8'}>
          <div className={'absolute top-0 h-full border-right -translate-x-[1px] left-5'}></div>
          {items.map(i => (
            <Item parentId={parent.metaId} id={i} key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

const Item = ({ id, parentId }: { id: number; parentId: number }) => {
  const m = MetaStore.useValue(id)
  if (m && !m.deleted) {
    return (
      <SearchItemRenderer
        onClick={() => {
          Global.searchOps?.closeSearchPanel()
          gotoContainedObject(parentId, id)
        }}
        selected={false}
        style={{
          background: undefined
        }}
        hit={{
          metaId: id,
          name: m.name || '',
          placeholderName: m.placeholderName
        }}
      />
    )
  }
  return null
}
