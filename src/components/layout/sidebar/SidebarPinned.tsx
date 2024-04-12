// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { Content } from '@/components/base'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { pinnedMetaObjectsAtom } from '@/api/stores/meta/meta.store'
import { memo } from 'react'
import SidebarObjectItem from './items/SidebarObjectItem'
import { pinnedCollectionsAtom } from '@/api/stores/collection.store'
import SidebarCollectionItem from './items/SidebarCollectionItem'
import { useToggle } from '@/hooks'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import { Colors } from '@/consts'

const SidebarPinned = memo(() => {
  const pinnedObjects = useGlobalAtomValue(pinnedMetaObjectsAtom)
  const pinnedCollections = useGlobalAtomValue(pinnedCollectionsAtom)
  const [collapsed, toggleCollapsed] = useToggle(false)
  const totalPinned = pinnedObjects.length + pinnedCollections.length
  const { t } = useTranslation()
  return (
    <Content flex column style={{ marginBottom: 10 }}>
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        style={{ fontSize: 13, color: Colors.Font.Transparent, paddingRight: 8 }}
      >
        <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={toggleCollapsed}>
          {t('sidebar.pinned')}
        </div>
        {totalPinned > 0 ? totalPinned : undefined}
      </Content>
      {!collapsed && (
        <Content style={{ marginLeft: -4 }}>
          {pinnedObjects.map(i => (
            <SidebarObjectItem draggable={false} key={i.id} id={i.id} />
          ))}
          {pinnedCollections.map(i => (
            <SidebarCollectionItem draggable={false} key={i.id} id={i.id} />
          ))}
        </Content>
      )}
    </Content>
  )
})

export default SidebarPinned
