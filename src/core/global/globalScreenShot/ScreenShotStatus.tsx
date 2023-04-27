import { useGlobalAtomValue } from '@/hooks'
import { GlobalScreenShotSelectionBoxState } from '.'
import { Content } from '@/components'
import ClassName from '@/styles/classNames'

const ScreenShotStatus = () => {
  const selectionBoxState = useGlobalAtomValue(GlobalScreenShotSelectionBoxState)
  if (!selectionBoxState?.rect) return null
  const { rect } = selectionBoxState
  return (
    <Content
      flex
      gap={10}
      className={ClassName.description()}
      style={{
        position: 'absolute',
        left: 0,
        top: -5,
        transform: rect.top < 40 ? 'translateY(50%)' : 'translateY(-100%)',
        borderRadius: 4,
        padding: '2px 6px',
        userSelect: 'none',
        width: 'max-content'
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
