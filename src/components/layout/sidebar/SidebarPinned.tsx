import { Content } from '@/components/base'
import { GlobalScope } from '@/jotai/jotaiScope'
import useCollectionStore, { pinnedCollectionsAtom } from '@/stores/collection.store'
import useDocumentStore, { pinnedDocumentsAtom } from '@/stores/document.store'
import { pinnedNotesAtom } from '@/stores/note.store'
import { useAtom } from 'jotai'
import { memo } from 'react'
import SidebarCollection, { SidebarCollectionItem, SidebarDocumentItem } from './SidebarCollection'

const SidebarPinned = memo(() => {
  const pinnedDocuments = useAtom(pinnedDocumentsAtom, GlobalScope)
  const pinnedCollections = useAtom(pinnedCollectionsAtom, GlobalScope)
  const pinnedNotes = useAtom(pinnedNotesAtom, GlobalScope)
  const { rootCollections } = useCollectionStore()
  const { all } = useDocumentStore()
  console.log(Array(10))
  return (
    <Content flex column>
      {rootCollections.map(i => (
        <SidebarCollectionItem collection={i} />
      ))}
      {all.map(i => (
        <SidebarDocumentItem document={i}/>
      ))}
    </Content>
  )
})

export default SidebarPinned
