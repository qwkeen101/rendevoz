import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { Content, Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'

export default () => {
  const [whiteboardState] = useWhiteboardState()
  const { t } = useTranslation()
  const wrapper = (message: string) => {
    return (
      <WithBorder
        blur
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: 8,
          fontSize: 13,
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: Colors.Background.Global,
          zIndex: 20
        }}
      >
        <Icon name={'park-info'} />
        {message}
      </WithBorder>
    )
  }
  if (whiteboardState.highlightedIds) {
    return wrapper(t('whiteboard.Esc highlight mode'))
  }

  return null
}
