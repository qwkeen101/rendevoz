// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { Content } from '@/components/base'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { pinnedCollectionsAtom } from '@/stores/collection.store'
import { pinnedDocumentsAtom } from '@/stores/document.store'
import { pinnedNotesAtom } from '@/stores/note.store'
import { memo } from 'react'
import SidebarCollectionItem from './items/SidebarCollectionItem'
import SidebarDocumentItem from './items/SidebarDocumentItem'
import SidebarNoteItem from './items/SidebarNoteItem'

const SidebarPinned = memo(() => {
  const pinnedDocuments = useGlobalAtomValue(pinnedDocumentsAtom)
  const pinnedCollections = useGlobalAtomValue(pinnedCollectionsAtom)
  const pinnedNotes = useGlobalAtomValue(pinnedNotesAtom)

  return (
    <Content flex column>
      {pinnedCollections.map(i => (
        <SidebarCollectionItem draggable={false} key={i.id} id={i.id} />
      ))}
      {pinnedDocuments.map(i => (
        <SidebarDocumentItem draggable={false} key={i.id} id={i.id} />
      ))}
      {pinnedNotes.map(i => (
        <SidebarNoteItem draggable={false} key={i.id} id={i.id} />
      ))}
    </Content>
  )
})

export default SidebarPinned
