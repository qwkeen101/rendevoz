import { SearchRelated, SearchRelatedResult } from '@/core/search/SearchDialog'
import { Fragment, memo, useLayoutEffect, useState } from 'react'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { CustomElement, MetaObject } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { Content, Icon, VirtualList } from '@/components'
import { ClassName } from 'rendevoz'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'
import { GlobalInstance } from '@/hooks'
import { Colors } from '@/consts'
import { waitFor } from '@/utils'
import { Node } from 'slate'

export default memo(({ related }: { related?: SearchRelated }) => {
  if (!related) return null
  return (
    <VirtualList
      style={{
        padding: 6,
        height: '100%'
      }}
      estimateSize={100}
      renderItem={i => <Wrapper item={i} />}
      items={[...related.group, ...related.whiteboard, ...related.note]}
    ></VirtualList>
  )
})

const Wrapper = ({ item }: { item: SearchRelatedResult }) => {
  const m = MetaStore.getCachedMetaObject(item.parent.metaId)
  if (!m || m.deleted) return null
  if (m.type === 'group' || m.type === 'whiteboard') {
    return <ParentChildItem item={item} type={m.type} />
  }
  if (m.type === 'note') {
    return <NoteParentItem item={item} />
  }
  return null
}
const ParentChildItem = ({ item, type }: { item: SearchRelatedResult; type: 'group' | 'whiteboard' | 'note' }) => {
  const [toggled, setToggled] = useState(false)
  if (item.children.length === 0) return null
  return (
    <Content flex column>
      <Content
        className={ClassName.flatButton()}
        style={{
          padding: 4
        }}
        flex
        alignItems={'center'}
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
            GlobalInstance.searchOps?.closeSearchPanel()
            Rendevoz.Actions.Open.Meta.openMetaObject(item.parent.metaId)
          }}
          style={{
            padding: '0px'
          }}
          selected={false}
          hit={item.parent}
          size={item.children.length}
        />
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
          {item.children.map(i => (
            <SearchItemRenderer
              style={{
                background: undefined
              }}
              onClick={() => {
                GlobalInstance.searchOps?.closeSearchPanel()
                if (type === 'whiteboard') {
                  const m = MetaStore.getCachedMetaObject(item.parent.metaId)?.objectId
                  if (m) {
                    GlobalInstance.layoutOps?.openObject<'whiteboard'>(item.parent.metaId).then(ins => {
                      if (ins) {
                        ins.moveToMetaNode?.(i.metaId, { select: true })
                      }
                    })
                  }
                }
                if (type === 'group') {
                  console.log('yes')
                  GlobalInstance.layoutOps?.openObject<'group'>(item.parent.metaId).then(ins => {
                    if (ins) {
                      waitFor(
                        () => !!ins.bodyOps?.scrollToMeta,
                        () => {
                          ins.bodyOps?.scrollToMeta?.(i.metaId, true)
                        }
                      )
                    }
                  })
                }
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

const NoteParentItem = ({ item }: { item: SearchRelatedResult }) => {
  const [toggled, setToggled] = useState(false)
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
              const secondWalk = firstWalk.map(i => {
                const blockContents = i.blocks
                  .map(o => {
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
                            content: `<mark>${m.name || m.placeholderName || 'Unnamed object'}</mark>`
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
                                const n = m.name || m.placeholderName || 'Unnamed object'
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
                                    const n = m.name || m.placeholderName || 'Unnamed object'
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

              setChildContents(secondWalk)
            }
          }
        }
      }
    }
    get()
  }, [])
  if (item.children.length === 0 || !childContents) return null
  return (
    <Content flex column>
      <Content
        className={ClassName.flatButton()}
        style={{
          padding: 4
        }}
        flex
        alignItems={'center'}
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
            Rendevoz.Actions.Open.Meta.openMetaObject(item.parent.metaId)
          }}
          style={{
            padding: '0px'
          }}
          selected={false}
          hit={item.parent}
          size={item.children.length}
        />
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
          {childContents.map(i => (
            <Fragment key={i.metaObject.id}>
              {i.blocks.map(o => (
                <div
                  onClick={() => {
                    GlobalInstance.searchOps?.closeSearchPanel()
                    GlobalInstance.layoutOps?.openObject<'editor'>(item.parent.metaId).then(ins => {
                      ins?.scrollToBlock?.({
                        blockId: o.id,
                        highlight: true
                      })
                    })
                  }}
                  className={ClassName.flatButton()}
                  key={o.id}
                  dangerouslySetInnerHTML={{ __html: o.content }}
                ></div>
              ))}
            </Fragment>
          ))}
        </Content>
      )}
    </Content>
  )
}
