import { Content, Icon } from '@/components'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { useNavigate } from 'react-router-dom'
import { INote } from '~/typings/data'

const NoteItem = ({ note }: { note: INote }) => {
  const navigate = useNavigate()
  return (
    <Content
      flex
      column
      onClick={() => {
        navigate(`/editor/${note.id}`)
      }}
      className={css({
        cursor: 'pointer',
        padding: '12px 18px',
        transition: 'all 0.3s ease-out',
        borderBottom: '1px solid rgba(222,222,222,0.5)',
        ':hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      })}
    >
      <div className={css([ClassName.title('16px'), ClassName.ellipsisFont(1)])}>{note.title || 'Untitled'}</div>
      <div className={ClassName.description('11px')}>{DateFormat.formatDistanceToNowStrict(note.createdAt)} ago</div>
    </Content>
  )
}

export default NoteItem
