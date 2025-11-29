import { ISidebarWidgetProps } from '@/components/layout/sidebar/main/index'
import SidebarObjectItem from '@/components/layout/sidebar/items/SidebarObjectItem'
import SidebarCollectionItem from '@/components/layout/sidebar/items/SidebarCollectionItem'
import Header from '@/components/layout/sidebar/main/Header'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { CollectionStore, MetaStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { memo } from 'react'
const PINNED_COLLAPSE_KEY = 'commomPinned'
export default memo(() => {
  const collapsed = KeyvalueStore.useValue('sidebarExpandData')?.includes(PINNED_COLLAPSE_KEY)
  const pinnedObjects = MetaStore.useIndexedMetaObjects().pinnedMetaObjectsSet
  const pinnedCollections = CollectionStore.useAll(i => i.pinned === true)
  const { t } = useTranslation()
  if (!pinnedCollections.length && !pinnedObjects.size) return null
  return (
    <div className={'w-full mb-4'}>
      <Header
        name={t(trans.Pinned)}
        onCollapse={() => {
          const current = KeyvalueStore.getOne('sidebarExpandData')
          KeyvalueStore.updateOne(
            'sidebarExpandData',
            current?.includes(PINNED_COLLAPSE_KEY)
              ? current?.filter(i => i !== PINNED_COLLAPSE_KEY)
              : [...(current || []), PINNED_COLLAPSE_KEY]
          )
        }}
      />
      {collapsed ? null : (
        <>
          {pinnedCollections.map(i => (
            <SidebarCollectionItem pin draggable={false} key={i.id} id={i.id} />
          ))}
          {Array.from(pinnedObjects.values()).map(i => (
            <SidebarObjectItem draggable={false} key={i.id} id={i.id} />
          ))}
        </>
      )}
    </div>
  )
})
