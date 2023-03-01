import { Content, Image } from '@/components/base'
import createNoteStore from '@/stores/note.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RenderElementProps } from 'slate-react'
import { INote } from '~/typings/data'
import { NoteElement } from '../../types/commonElementTypes'
import NoteCard from '../cards/NoteCard'

const NoteMedia = ({ element, children }: Omit<RenderElementProps, 'attributes'>) => {
  const ele = element as NoteElement
  const [note, setNote] = useState<INote>()
  const { getNoteById } = createNoteStore()
  const navigate = useNavigate()
  useEffect(() => {
    getNoteById(ele.noteId).then(n => {
      setNote(n)
    })
  }, [])

  const renderLineMain = () => (
    <Content flex auto alignItems="center" justifyContent="space-between" gap={20}>
      <span
        onClick={() => navigate(`/editor/${ele.noteId}`)}
        className={css([
          ClassName.animatedBorderBottom(-1, 0, 1, element.color),
          ClassName.title('16px', 500, element.color),
          ClassName.link()
        ])}
      >
        {note?.title}
      </span>
      <Content>
        <div className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}>Note</div>
      </Content>
    </Content>
  )
  return <NoteCard type="note" children={children} pictureUrl={note?.coverImgSrc} element={element} main={renderLineMain()} />
}

export default NoteMedia
