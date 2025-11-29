import { ISearchResult } from '@/api/textSearch/types'
import { Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { MetaStore } from '@/api/stores'
import { memo, useEffect, useState } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(({ results, onNumChange }: { results: ISearchResult; onNumChange: (num: number) => void }) => {
  useEffect(() => {
    const related = MetaStore.getIndexedMetaLinks()?.relatedIdsMap
    const metaIdSet = new Set<number>()
    results.forEach(m => {
      const r = related?.get(m.metaId)
      r?.forEach(o => {
        if (MetaStore.getCachedMetaObject(o)) {
          metaIdSet.add(o)
        }
      })
    })
    onNumChange(metaIdSet.size)
  }, [results])
  return (
    <VirtualList
      estimateSize={100}
      items={results}
      renderItem={i => <RelatedItem key={i.metaId} item={i} />}
      style={{
        padding: '6px',
        width: '100%',
        height: '100%'
      }}
    ></VirtualList>
  )
})

const RelatedItem = ({ item }: { item: ISearchResult[0] }) => {
  const meta = MetaStore.getCachedMetaObject(item.metaId)
  const [toggled, setToggled] = useState(true)
  if (!meta || meta.deleted) return null
  const related = MetaStore.getIndexedMetaLinks()?.relatedIdsMap
  if (!related) return null
  const selfRelated = related.get(item.metaId)
  if (!selfRelated?.size) return null
  return (
    <div className={'flex flex-col'}>
      <div className={'button flex items-center !p-1.5'}>
        <Icon
          size={18}
          onClick={() => setToggled(!toggled)}
          className={classnames('p-1 transition-transform', !toggled && 'rotate-90')}
          name={'park-right'}
        />
        <SearchItemRenderer
          onClick={() => {
            Global.layoutOps?.openObject(item.metaId)
            Global.searchOps?.closeSearchPanel()
          }}
          size={selfRelated.size}
          hit={item}
          selected={false}
          style={{
            padding: 0
          }}
        />
      </div>
      {!toggled && (
        <div className={'flex flex-col pl-8 relative'}>
          <div className={'absolute top-0 h-full border-right -translate-x-[1px] left-5'}></div>
          {Array.from(selfRelated.values()).map(i => (
            <ChildItem metaId={i} key={i} />
          ))}
        </div>
      )}
    </div>
  )
}
const ChildItem = ({ metaId }: { metaId: number }) => {
  const m = MetaStore.getCachedMetaObject(metaId)
  const { t } = useTranslation()
  if (m && !m.deleted) {
    return (
      <div
        onClick={() => {
          Global.layoutOps?.openObject(metaId)
          Global.searchOps?.closeSearchPanel()
        }}
        className={'button !p-1.5 gap-2 flex items-center'}
      >
        {m.coverImgSrc ? (
          <img src={m.coverImgSrc} width={16} height={16} className={'rounded object-cover'} />
        ) : (
          <Icon name={Global.utils.getIcon(m.type)} size={16} />
        )}
        <div className={'font-semibold line-clamp-1'} title={m.name}>
          {m.name || t(trans.Unnamed)}
        </div>
      </div>
    )
  }
  return null
}
