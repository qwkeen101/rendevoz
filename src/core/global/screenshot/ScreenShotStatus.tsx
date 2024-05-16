import { useGlobalAtomValue } from '@/hooks'
import { GlobalScreenShotSelectionBoxState } from '.'
import { Content } from '@/components'
import { css } from '@emotion/css'
import Colors from '@/consts/colors'

const ScreenShotStatus = () => {
  const selectionBoxState = useGlobalAtomValue(GlobalScreenShotSelectionBoxState)
  if (!selectionBoxState?.rect) return null
  const { rect } = selectionBoxState
  return (
    <Content
      flex
      gap={10}
      // @ts-ignore
      className={css({
        '*': {
          textTransform: 'none !important'
        }
      })}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: rect.top < 40 ? 'translateY(50%)' : 'translateY(-100%)',
        borderRadius: 4,
        padding: '2px 0px',
        userSelect: 'none',
        width: 'max-content',
        color: Colors.Font.White,
        fontSize: 13
      }}
    >
      <div>
        {Math.abs(rect.width).toFixed(0)} × {Math.abs(rect.height).toFixed(0)}
      </div>
    </Content>
  )
}

export default ScreenShotStatus
