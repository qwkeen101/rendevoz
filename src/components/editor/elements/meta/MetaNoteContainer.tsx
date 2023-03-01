import { Content } from '@/components/base'
import createNoteStore from '@/stores/note.store'
import { useState, useEffect } from 'react'
import { MetaKnowledgeObject, INote } from '~/typings/data'
import MetaNoteItem from './MetaNoteItem'

const MetaNoteContainer = ({ obj, onNoteClick }: { obj?: MetaKnowledgeObject; onNoteClick?: React.MouseEventHandler }) => {
  const { getNotesByIds } = createNoteStore()
  const [notes, setNotes] = useState<INote[]>([])
  useEffect(() => {
    getNotesByIds(obj?.noteIds || []).then(data => {
      setNotes(data.filter(i => !!i))
    })
  }, [obj])
  return (
    <Content flex column style={{ marginLeft: '-6px' }}>
      {notes.map(i => (
        <MetaNoteItem onClick={onNoteClick} note={i} />
      ))}
    </Content>
  )
}
export default MetaNoteContainer
