import { MetaStore, ObjectStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { Content } from '@/components'

export default ({id}: {id: number}) => {
  const group = ObjectStore('group').useValue(id)
  const [names, setNames] = useState<string[]>([])
  useEffect(() => {
    if (group?.values) {
      const map = MetaStore.getMetaObjectsMap()
      const metaIds = new Set(group.values.map(i => i.id))
      setNames(
        Array.from(metaIds.values())
          .map(i => map.get(i))
          .filter(i => i)
          .map(i => i.name || i.placeholderName) as string[]
      )
    }
  }, [group?.values])
  if (!names.length) return null
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