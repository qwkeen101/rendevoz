import { Colors } from '@/consts'
import { useIsIn } from '@/hooks'
export default ({ isResizing }: { isResizing?: boolean }) => {
  const { isIn, ref } = useIsIn()
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        background: isIn || isResizing ? Colors.Background.ButtonHover : undefined,
        transition: 'background 0.2s ease'
      }}
    >
      <div style={{ width: 1, height: '100%', background: Colors.Background.Border }}></div>
    </div>
  )
}
