import { MetaStore } from '@/stores'
import { useEffect, useState } from 'react'
import { Rendevoz } from '@/core/rendevoz'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'

export default ({ metaId }: { metaId: number }) => {
  const map = MetaStore.useIndexedMetaObjects()?.metaAttachmentIdToMetaIdsMap
  const parentItemsMap = map?.get(metaId)
  const [parentItems, setParentItems] = useState([])
  useEffect(() => {
    if (parentItemsMap?.size) {
      const metaMap = MetaStore.getMetaObjectsMap()
      const items = Array.from(parentItemsMap.values())
        .map(i => {
          const item = metaMap.get(i)
          if (!item) return null
          return {
            id: i,
            name: item.name,
            icon: Rendevoz.Utils.Object.getMetaObjectIcon(item.type)
          }
        })
        .filter(i => i)
      setParentItems(items)
    } else {
      setParentItems([])
    }
  }, [parentItemsMap?.size])
  if (!parentItems?.length) return null
  return (
    <Content flex gap={6} style={{ overflow: 'hidden' }}>
      {parentItems.map(i => (
        <Content flex gap={4} key={i.id}>
          <Icon name={i.icon} />
          <div style={{ whiteSpace: 'nowrap' }}>{i.name}</div>
        </Content>
      ))}
    </Content>
  )
}
