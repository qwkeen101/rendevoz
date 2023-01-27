import { Content } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { MetaObject } from '~/typings/data'
import { TitleClassName, TitleWrapperClassName } from './DatabaseCard'
import { memo } from 'react'
import ClassName from '@/styles/classNames'
import { useNavigate } from 'react-router-dom'
import useNoteStore from '@/stores/note.store'
import useEventEmitter from '@/events/useEventEmitter'

const MetaKnowledgeCard = memo(({ m }: { m: MetaObject }) => {
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const { getBlockById } = useNoteStore()

  const emitter = useEventEmitter()
  const navigate = useNavigate()
  return (
    <Content flex column>
      <Content className={TitleWrapperClassName}>
        <div
          className={TitleClassName}
          onClick={() => {
            if (m.type === 'noteElement') {
              m.objectId &&
                getBlockById(m.objectId).then(block => {
                  if (block) {
                    navigate(`/editor/${block.noteId}`)
                    emitter.emit(
                      'editor',
                      {
                        type: 'jumpToBlock',
                        data: {
                          blockId: block.id,
                          noteId: block.noteId
                        }
                      },
                      true
                    )
                  }
                })
              return
            }
            if (m.type === 'normal') {
              navigate(`/editor/${m.objectId}`)
            }
            if (m.type === 'note') {
              navigate(`/editor/${m.objectId}`)
            }
          }}
        >
          {m.name}
        </div>
        <div
          className={css([
            {
              color: defaultFontColorGrey,
              fontSize: 13,
              marginTop: 6
            },
            ClassName.ellipsisFont(6)
          ])}
        >
          {m.description}
        </div>
      </Content>
    </Content>
  )
})

export default MetaKnowledgeCard
