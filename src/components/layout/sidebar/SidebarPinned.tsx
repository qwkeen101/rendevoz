import { Content } from '@/components/base'
import { GlobalScope } from '@/jotai/jotaiScope'
import { pinnedCollectionsAtom } from '@/stores/collection.store'
import { pinnedDocumentsAtom } from '@/stores/document.store'
import { pinnedNotesAtom } from '@/stores/note.store'
import { useAtomValue } from 'jotai'
import { memo } from 'react'
import { SidebarCollectionItem, SidebarDocumentItem, SidebarNoteItem } from './SidebarCollection'

const SidebarPinned = memo(() => {
  const pinnedDocuments = useAtomValue(pinnedDocumentsAtom, GlobalScope)
  const pinnedCollections = useAtomValue(pinnedCollectionsAtom, GlobalScope)
  const pinnedNotes = useAtomValue(pinnedNotesAtom, GlobalScope)

  return (
    <Content flex column>
      {pinnedCollections.map(i => (
        <SidebarCollectionItem key={i.id} collectionId={i.id} parentCollectionId={i.parentId || 1}/>
      ))}
      {pinnedDocuments.map(i => (
        <SidebarDocumentItem key={i.id} documentId={i.id} />
      ))}
      {pinnedNotes.map(i => (
        <SidebarNoteItem key={i.id} noteId={i.id} />
      ))}
    </Content>
  )
})

export default SidebarPinned
