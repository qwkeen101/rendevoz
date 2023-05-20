// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { Content } from '@/components/base'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { pinnedMetaObjectsAtom } from '@/stores/meta.store'
import { memo } from 'react'
import SidebarObjectItem from './items/SidebarObjectItem'
import { pinnedCollectionsAtom } from '@/stores/collection.store'
import SidebarCollectionItem from './items/SidebarCollectionItem'
import { useToggle } from '@/hooks'
import { useTranslation } from 'react-i18next'

const SidebarPinned = memo(() => {
  const pinnedObjects = useGlobalAtomValue(pinnedMetaObjectsAtom)
  const pinnedCollections = useGlobalAtomValue(pinnedCollectionsAtom)
  const [collapsed, toggleCollapsed] = useToggle(false)
  const totalPinned = pinnedObjects.length + pinnedCollections.length
  const { t } = useTranslation()
  return (
    <Content flex column>
      <Content flex alignItems="center" justifyContent="space-between" style={{ padding: '0px 9px 0px 4px', marginTop: 20 }}>
        <div style={{ cursor: 'pointer' }} onClick={toggleCollapsed}>
          {t('sidebar.pinned')}
        </div>
        {totalPinned > 0 ? totalPinned : undefined}
      </Content>
      {!collapsed && (
        <>
          {pinnedObjects.map(i => (
            <SidebarObjectItem draggable={false} key={i.id} id={i.id} />
          ))}
          {pinnedCollections.map(i => (
            <SidebarCollectionItem draggable={false} key={i.id} id={i.id} />
          ))}
        </>
      )}
    </Content>
  )
})

export default SidebarPinned
