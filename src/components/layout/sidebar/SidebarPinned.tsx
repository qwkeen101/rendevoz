import { Content } from '@/components/base'
import { GlobalScope } from '@/jotai/jotaiScope'
import { pinnedCollectionsAtom } from '@/stores/collection.store'
import { pinnedDocumentsAtom } from '@/stores/document.store'
import { pinnedNotesAtom } from '@/stores/note.store'
import { globalStore } from '@/stores/stores'
import { useAtomValue } from 'jotai/react'
import { memo } from 'react'
import { SidebarCollectionItem, SidebarDocumentItem, SidebarNoteItem } from './SidebarCollection'

const SidebarPinned = memo(() => {
  const pinnedDocuments = useAtomValue(pinnedDocumentsAtom, { store: globalStore })
  const pinnedCollections = useAtomValue(pinnedCollectionsAtom, { store: globalStore })
  const pinnedNotes = useAtomValue(pinnedNotesAtom, { store: globalStore })

  return (
    <Content flex column>
      {pinnedCollections.map(i => (
        <SidebarCollectionItem key={i.id} collectionId={i.id} parentCollectionId={i.parentId || 1} />
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
