import { useGlobalAtomValue } from '@/hooks'
import { GlobalScreenShotSelectionBoxState } from '.'
import { Content } from '@/components'
import ClassName from '@/styles/classNames'
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
        top: -5,
        transform: rect.top < 40 ? 'translateY(50%)' : 'translateY(-100%)',
        borderRadius: 4,
        padding: '2px 6px',
        userSelect: 'none',
        width: 'max-content',
        color: Colors.Font.White
      }}
    >
      <div>x: {rect.left.toFixed(0)}px</div>
      <div>y: {rect.top.toFixed(0)}px</div>
      <div>width: {Math.abs(rect.width).toFixed(0)}px</div>
      <div>height: {Math.abs(rect.height).toFixed(0)}px</div>
    </Content>
  )
}

export default ScreenShotStatus
