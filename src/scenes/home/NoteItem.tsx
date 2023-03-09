import Actions from '@/Actions'
import { Content } from '@/components'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import { INote } from '~/typings/data'

const NoteItem = ({ note }: { note: INote }) => {
  const { t } = useTranslation()
  return (
    <Content
      flex
      column
      onClick={() => {
        Actions.openEditor(note.id)
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
      <div className={css([ClassName.title('16px'), ClassName.ellipsisFont(1)])}>{note.title || t('editor.untitled')}</div>
      <div className={ClassName.description('11px')}>{t('home.ago', { time: DateFormat.formatDistanceToNowStrict(note.createdAt) })}</div>
    </Content>
  )
}

export default NoteItem
