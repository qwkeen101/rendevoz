import { useEffect, useState } from 'react'
import { MetaStore } from '@/stores'
import { useRenderObject } from '@/core'
import { Content, Icon } from '@/components'
import { useIsIn } from '@/hooks'
import { ClassName } from 'rendevoz'

const RelatedRenderer = ({ metaId, direction }: { metaId: number; direction: 'in' | 'out' | 'both' }) => {
  const [editLinkState, setEditLinkState] = useState<{
    editing: boolean
    linkId: number
  }>()
  const [relations, setRelations] = useState<
    {
      linkId: number
      relatedObjectId: number
    }[]
  >()
  const linkIndex = MetaStore.useIndexedMetaLinks()
  useEffect(() => {
    if (!linkIndex) return
    const links: Set<number> = new Set<number>()
    const { sourceIdToLinkIdsMap, targetIdToLinkIdMap } = linkIndex
    switch (direction) {
      case 'in':
        Array.from(targetIdToLinkIdMap.get(metaId)?.values() || []).forEach(i => links.add(i))
        break
      case 'out':
        Array.from(sourceIdToLinkIdsMap.get(metaId)?.values() || []).forEach(i => links.add(i))
        break
      case 'both':
        Array.from(targetIdToLinkIdMap.get(metaId)?.values() || []).forEach(i => links.add(i))
        Array.from(sourceIdToLinkIdsMap.get(metaId)?.values() || []).forEach(i => links.add(i))
        break
    }
    const allLinks = Array.from(links.values())
    const linkMap = MetaStore.getMetaLinksMap()
    setRelations(
      allLinks
        .map(i => {
          const link = linkMap.get(i)
          if (!link) return
          return {
            linkId: link.id,
            relatedObjectId: link.sourceId === metaId ? link.targetId : link.sourceId
          }
        })
        .filter(i => i) as typeof relations
    )
  }, [metaId, linkIndex])

  return (
    <Content flex column style={{ minWidth: 200, maxWidth: 400 }}>
      {relations?.map(i => <LinkRenderer linkId={i.linkId} key={i.linkId} objectId={i.relatedObjectId} />)}
    </Content>
  )
}

const LinkRenderer = ({ linkId, objectId }: { linkId: number; objectId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: objectId })
  const link = MetaStore.useMetaLinksMap().get(linkId)
  const { ref, isIn } = useIsIn()
  return (
    <Content flex ref={ref} className={ClassName.flatButton()} gap={10}>
      <Content>
        {renderInline({
          ellipsisLine: 1
        })}
        {link?.label}
      </Content>
      <Icon name={'park-edit'} containerStyle={{ opacity: isIn ? 1 : 0 }} />
    </Content>
  )
}

const EditLinkPanel = () => {}

export default RelatedRenderer
