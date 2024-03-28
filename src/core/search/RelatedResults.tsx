import { ISearchResult } from '@/api/textSearch/types'
import { Content, Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { MetaStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { memo, useEffect, useState } from 'react'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { GlobalInstance } from '@/hooks'

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
    <Content flex column>
      <Content
        className={ClassName.flatButton()}
        style={{
          padding: 4
        }}
        flex
        alignItems={'flex-start'}
      >
        <Icon
          size={18}
          onClick={() => setToggled(!toggled)}
          style={{
            transition: 'all 0.16s ease',
            transform: toggled ? undefined : 'rotate(90deg)'
          }}
          name={'park-right'}
          className={ClassName.flatButton(4, '3px')}
        />
        <SearchItemRenderer
          onClick={() => {
            GlobalInstance.layoutOps?.openObject(item.metaId)
            GlobalInstance.searchOps?.closeSearchPanel()
          }}
          size={selfRelated.size}
          hit={item}
          selected={false}
          style={{
            padding: 0
          }}
        />
      </Content>
      {!toggled && (
        <Content
          flex
          column
          gap={4}
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
          {Array.from(selfRelated.values()).map(i => (
            <ChildItem metaId={i} key={i} />
          ))}
        </Content>
      )}
    </Content>
  )
}
const ChildItem = ({ metaId }: { metaId: number }) => {
  const m = MetaStore.getCachedMetaObject(metaId)
  if (m && !m.deleted) {
    return (
      <Content
        onClick={() => {
          GlobalInstance.layoutOps?.openObject(metaId)
          GlobalInstance.searchOps?.closeSearchPanel()
        }}
        gap={6}
        flex
        alignItems={'center'}
        className={ClassName.flatButton()}
      >
        {m.coverImgSrc ? (
          <img src={m.coverImgSrc} width={16} height={16} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(m.type)} size={16} />
        )}
        <div className={'ellipsis-font-1 font-size-14 bold-font'} title={m.name || m.placeholderName}>
          {m.name || m.placeholderName}
        </div>
      </Content>
    )
  }
  return null
}
