import useGroupState from '@/core/group/hooks/useGroupState'
import { createPortal } from 'react-dom'
import { Colors } from '@/consts'

const GroupOverlay = () => {
  const [groupState] = useGroupState()
  if (groupState.selectArea) {
    return createPortal(
      <div style={{ zIndex: 9999, position: 'fixed', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', ...groupState.selectArea, background: Colors.Common.SelectColorTransparent }}></div>
      </div>,
      document.body
    )
  }
}

export default GroupOverlay
