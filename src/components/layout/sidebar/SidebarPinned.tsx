// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { Content } from '@/components/base'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { pinnedMetaObjectsAtom } from '@/stores/meta.store'
import { memo } from 'react'
import SidebarObjectItem from './items/SidebarObjectItem'

const SidebarPinned = memo(() => {
  const pinnedObjects = useGlobalAtomValue(pinnedMetaObjectsAtom)
  return (
    <Content flex column>
      {pinnedObjects.map(i => (
        <SidebarObjectItem draggable={false} key={i.id} id={i.id} />
      ))}
    </Content>
  )
})

export default SidebarPinned
