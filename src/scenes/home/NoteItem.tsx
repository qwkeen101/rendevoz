import { Content, Icon } from '@/components'
import { css } from '@emotion/css'
import { useNavigate } from 'react-router-dom'
import { INote } from '~/typings/data'

const NoteItem = ({ note }: { note: INote }) => {
  const navigate = useNavigate()
  return (
    <Content
      flex
      onClick={() => {
        navigate(`/editor/${note.id}`)
      }}
      alignItems="center"
      gap={15}
      className={css({
        cursor: 'pointer',
        padding: '6px 16px',
        transition: 'all 0.2s ease',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        ':hover': {
          background: 'rgba(0,0,0,0.07)',
          borderBottom: '1px solid transparent'
        }
      })}
    >
      <Icon fill="#8590ae" size={18} theme="filled" name="park-notes" />
      <div
        className={css({
          fontSize: 15,
          fontWeight: 600
        })}
      >
        {note.title || 'Untitled'}
      </div>
    </Content>
  )
}

export default NoteItem
