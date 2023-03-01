import { Icon } from '@/components'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { css } from '@emotion/css'
import { INote } from '~/typings/data'

const MetaNoteItem = ({ note, onClick }: { note: INote; onClick?: React.MouseEventHandler }) => {
  const emitter = useScopedEventEmitter()
  return (
    <div
      className={css({
        marginLeft: -4,
        padding: '4px 4px 4px 10px',
        borderRadius: 4,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        ':hover': {
          background: 'rgba(0,0,0,0.06)'
        },
        display: 'flex',
        alignItems: 'center',
        gap: 10
      })}
    >
      <Icon name="park-notes" />
      {note.title}
    </div>
  )
}

export default MetaNoteItem
