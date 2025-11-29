import { memo, useEffect, useLayoutEffect, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content } from '@/components'
import EmptyCard from '@/core/components/common/EmptyCard'

function WhiteboardDisplayer({ id }: { id: number }) {
  const whiteboard = ObjectStore('whiteboard').useValue(id)
  const [names, setNames] = useState<string[]>([])
  useLayoutEffect(() => {
    if (whiteboard?.nodes) {
      const map = MetaStore.getMetaObjectsMap()
      setNames(
        Array.from(whiteboard.nodes.values())
          .filter(i => i.type === 'metaObject')
          .map(i => map.get(i.metaObjectId))
          .filter(i => i && (i.name || i.placeholderName))
          .map(i => i.name || i.placeholderName) as string[]
      )
    }
  }, [whiteboard?.nodes])
  if (!names.length) return <EmptyCard />
  return (
    <Content
      flex
      gap={4}
      style={{
        padding: 10,
        flexWrap: 'wrap'
      }}
    >
      {names.map((i, idx) => (
        <span style={{ fontSize: 12 }} className={'object-name-item'} key={idx}>
          {i}
        </span>
      ))}
    </Content>
  )
}

export default memo(WhiteboardDisplayer)
