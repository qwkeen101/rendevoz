import { Content, Icon } from '@/components'
import classnames from 'classnames'

export default ({ on, name, pinActive }: { on: (type: 'close' | 'pin') => void; pinActive?: boolean; name: string }) => {
  return (
    <div className={'drag-handle items-center flex justify-between cursor-grab shrink-0 px-3 py-2'}>
      <div className={'font-medium'}>{name}</div>
      <div className={'flex items-center gap-3'}>
        <Icon
          className={classnames('hover-active-button', pinActive && 'select-color-font')}
          size={16}
          name="park-pushpin"
          theme={pinActive ? 'filled' : undefined}
          onClick={() => {
            on?.('pin')
          }}
        />
        <Icon
          className={'hover-active-button'}
          size={16}
          name="park-close"
          onClick={() => {
            on?.('close')
          }}
        />
      </div>
    </div>
  )
}
