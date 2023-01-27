import { Content } from '@/components'
import { GlobalScope } from '@/jotai/jotaiScope'
import { notesAtom } from '@/stores/note.store'
import { globalStore } from '@/stores/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetaObject } from '~/typings/data'
import { TitleClassName, TitleWrapperClassName } from './DatabaseCard'

const MetaNoteCard = memo(({ m }: { m: MetaObject }) => {
  const noteId = m.objectId
  const noteAtom = useMemo(() => (noteId ? atom(get => get(notesAtom).get(noteId)) : atom(null)), [noteId])
  const note = useAtomValue(noteAtom, { store: globalStore })
  const navigate = useNavigate()
  return (
    <Content flex column>
      <Content className={TitleWrapperClassName}>
        <div
          className={TitleClassName}
          onClick={() => {
            navigate(`/editor/${noteId}`)
          }}
        >
          {note?.title || m.name}
        </div>
        <div className={css([ClassName.description(), ClassName.ellipsisFont(6)])}>{m.description}</div>
      </Content>
    </Content>
  )
})

export default MetaNoteCard
