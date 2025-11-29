import { SearchRelated, SearchRelatedResult } from '@/core/search/SearchDialog'
import { Fragment, memo, useLayoutEffect, useState } from 'react'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { CustomElement, MetaObject } from '~/typings'
import { Icon, VirtualList } from '@/components'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { Node } from 'slate'
import gotoContainedObject from '@/core/object/gotoContainedObject'
import classnames from 'classnames'
import { ISearchResult } from '@/api/textSearch/types'
import { useTranslation } from 'react-i18next'

export default memo(({ related }: { related?: SearchRelated }) => {
  if (!related) return null
  const r = Object.values(related).flat(1)
  console.log(related, r)
  r.sort((a, b) => b.children.length - a.children.length)
  return (
    <VirtualList
      style={{
        padding: 6,
        height: '100%'
      }}
      paddingEnd={100}
      estimateSize={100}
      renderItem={i => <Wrapper item={i} />}
      items={r}
    ></VirtualList>
  )
})

const Wrapper = ({ item }: { item: SearchRelatedResult }) => {
  const m = MetaStore.getCachedMetaObject(item.parent.metaId)
  if (!m || m.deleted) return null
  if (m.type === 'note') {
    return <NoteParentItem item={item} />
  }
  return <ParentChildItem item={item} />
}
const ParentChildItem = ({ item }: { item: SearchRelatedResult }) => {
  const [toggled, setToggled] = useState(true)
  if (item.children.length === 0) return null
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
            Global.searchOps?.closeSearchPanel()
            Global.layoutOps?.openObject(item.parent.metaId)
          }}
          selected={false}
          style={{
            padding: 0
          }}
          hit={item.parent}
          size={item.children.length}
        />
      </div>
      {!toggled && (
        <div className={'flex flex-col pl-8 relative'}>
          <div className={'absolute top-0 h-full border-right -translate-x-[1px] left-5'}></div>
          {item.children.map(i => (
            <SearchItemRenderer
              style={{
                background: undefined
              }}
              onClick={() => {
                Global.searchOps?.closeSearchPanel()
                gotoContainedObject(item.parent.metaId, i.metaId)
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

const NoteParentItem = ({ item }: { item: SearchRelatedResult }) => {
  const [toggled, setToggled] = useState(true)
  const [childContents, setChildContents] = useState<
    {
      metaObject: MetaObject
      blocks: {
        id: number
        // no content: meta block, with content: inline
        content?: string
      }[]
    }[]
  >()
  const { t } = useTranslation()
  const [normalizedChildren, setNormalizedChildren] = useState<ISearchResult>([])
  useLayoutEffect(() => {
    const get = async () => {
      const insideIdSet = new Set(item.children.map(i => i.metaId))
      const noteMeta = MetaStore.getCachedMetaObject(item.parent.metaId)
      if (noteMeta) {
        const note = await ObjectStore('note').getOneById(noteMeta.objectId!)
        if (note) {
          const insideMetas = note.insideMetas
          if (insideMetas) {
            const noteContent = await NoteStore.getNoteIdValue(note.id)
            if (noteContent) {
              const firstWalk = item.children.map(i => ({
                metaObject: MetaStore.getCachedMetaObject(i.metaId),
                blocks: insideMetas[i.metaId]
              }))
              const alreadyPushedBlockIds = new Set<number>()
              const finalChildren: ISearchResult = []
              const secondWalk = firstWalk
                .map(i => {
                  if (!i.blocks && i.metaObject) {
                    const c = item.children.find(o => o.metaId === i.metaObject?.id)
                    if (c) {
                      finalChildren.push(c)
                    }
                    return
                  }
                  if (!i.blocks) return
                  const blockContents = i.blocks
                    ?.map(o => {
                      const targetBlock = noteContent.find(c => c.id === o)
                      if (targetBlock) {
                        if (alreadyPushedBlockIds.has(targetBlock.id)) return
                        alreadyPushedBlockIds.add(targetBlock.id)
                        const ele = targetBlock as CustomElement
                        if (ele.type === 'metaObject' && insideIdSet.has(ele.originId)) {
                          const m = MetaStore.getCachedMetaObject(ele.originId)
                          if (m) {
                            return {
                              id: o,
                              content: `<mark>${Global.metaOps.getMetaName(m)}</mark>`
                            }
                          }
                        } else {
                          let str = ''
                          const eleArr = ele.children
                          eleArr.forEach(b => {
                            if ('type' in b) {
                              if (b.type === 'inline-metaObject') {
                                const m = MetaStore.getCachedMetaObject(b.originId)
                                if (m) {
                                  const n = Global.metaOps.getMetaName(m)
                                  if (insideIdSet.has(m.id)) {
                                    str += `<mark>${n}</mark>`
                                  } else {
                                    str += n
                                  }
                                }
                                return
                              }
                              if (b.type === 'link') {
                                if (b.url?.startsWith('rendevoz://object/'))
                                  try {
                                    const u = new URL(b.url)
                                    const id = parseInt(u.pathname.replace('//object/', ''))
                                    const m = MetaStore.getCachedMetaObject(id)
                                    if (m) {
                                      const n = Global.metaOps.getMetaName(m)
                                      if (insideIdSet.has(m.id)) {
                                        str += `<mark>${n}</mark>`
                                      } else {
                                        str += n
                                      }
                                      return
                                    }
                                  } catch (e) {}
                                return
                              }
                            }
                            str += Node.string(b)
                          })
                          return {
                            id: o,
                            content: str
                          }
                        }
                      }
                    })
                    .filter(i => i)
                  return {
                    metaObject: i.metaObject,
                    blocks: blockContents
                  }
                })
                .filter(i => i)

              setChildContents(secondWalk)
              setNormalizedChildren(finalChildren)
            }
          }
        }
      }
    }
    get()
  }, [])
  if (item.children.length === 0 || !childContents) return null
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
            Global.layoutOps?.openObject(item.parent.metaId)
          }}
          style={{
            padding: '0px'
          }}
          selected={false}
          hit={item.parent}
          size={item.children.length}
        />
      </div>
      {!toggled && (
        <div className={'flex flex-col pl-8 relative'}>
          <div className={'absolute top-0 h-full border-right -translate-x-[1px] left-5'}></div>
          {childContents?.map(i => (
            <Fragment key={i.metaObject.id}>
              {i.blocks.map(o => (
                <div
                  onClick={() => {
                    Global.searchOps?.closeSearchPanel()
                    Global.layoutOps?.openObject<'editor'>(item.parent.metaId).then(ins => {
                      ins?.scrollToBlock?.({
                        blockId: o.id,
                        highlight: true
                      })
                    })
                  }}
                  className={'button'}
                  key={o.id}
                  dangerouslySetInnerHTML={{ __html: o.content }}
                ></div>
              ))}
            </Fragment>
          ))}
          {normalizedChildren.map(i => (
            <SearchItemRenderer
              style={{
                background: undefined
              }}
              onClick={() => {
                Global.searchOps?.closeSearchPanel()
                gotoContainedObject(item.parent.metaId, i.metaId)
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
