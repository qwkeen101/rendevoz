import { CollectionStore } from '@/api/stores'
import { useEffect, useMemo, useRef, useState } from 'react'
import SidebarCollectionItem from './items/SidebarCollectionItem'
import { ICollectionItem } from '~/typings'
import { compareStrings } from '@/utils/str'

const SidebarCollection = ({ onClick }: { onClick?: (e: MouseEvent, item: ICollectionItem) => void }) => {
  const rootCollections = CollectionStore.useAll(i => i.parentId === 0)
  const prevCollections = useRef(rootCollections)
  const [updated, setUpdated] = useState(0)
  useEffect(() => {
    const prev = prevCollections.current
    if (!prev) {
      setUpdated(s => s + 1)
    }
    if (prev.length !== rootCollections.length || !prev.every((i, idx) => rootCollections[idx].name === i.name)) {
      setUpdated(s => s + 1)
    }
    prevCollections.current = rootCollections
  }, [rootCollections])
  const sortedCollections = useMemo(() => {
    return rootCollections.slice().sort((a, b) => compareStrings(a.name, b.name))
  }, [updated])
  return sortedCollections.map(i => <SidebarCollectionItem onClick={onClick} key={i.id} id={i.id} parentId={0} />)
}
export default SidebarCollection
