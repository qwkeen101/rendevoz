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
      items={Object.entries(tagState)}
      renderItem={i => <ParentChildItem items={i[1]} tagId={Number(i[0])} key={i[0]} />}
    ></VirtualList>
  )
})

const ParentChildItem = ({ items, tagId }: { items: ISearchResult; tagId: number }) => {
  const [toggled, setToggled] = useState(true)
  if (items.length === 0) return null
  return (
    <Content flex column>
      <Content
        className={ClassName.flatButton()}
        style={{
          padding: 4
        }}
        flex
        onClick={() => {
          Rendevoz.Actions.Open.Group.openTagGroup(tagId)
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
            transform: toggled ? undefined : 'rotate(90deg)',
            padding: 3
          }}
          name={'park-right'}
        />
        <Tag showEdit={false} hideDelete hideSize hideAdd small square tag={tagId} />
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
