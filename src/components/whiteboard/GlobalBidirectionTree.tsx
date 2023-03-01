import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { useState } from 'react'
import Whiteboard from './Whiteboard'
import Modal from '../base/Modal'

export const GlobalBidirectionTreeInstance: {
  open?: (centerNodeId: number) => void
} = {}

const GlobalBidirectionTree = () => {
  const [treeState, setTreeState] = useState<
    Partial<{
      visible: boolean
      centerNodeId: number
    }>
  >({
    visible: false
  })

  Object.assign(GlobalBidirectionTreeInstance, {
    open: id =>
      setTreeState({
        visible: true,
        centerNodeId: id
      })
  } as typeof GlobalBidirectionTreeInstance)
  return (
    <Modal
      width="90vw"
      height="90vh"
      visible={!!(treeState.visible && treeState.centerNodeId)}
      onClose={() => setTreeState({ visible: false })}
      style={{
        backdropFilter: 'none',
        background: 'none',
        position: 'relative'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none'
        }}
        className={ClassName.Background.blurBackground}
      ></div>
      <Whiteboard centerNodeId={treeState.centerNodeId!} />
    </Modal>
  )
}

export default GlobalBidirectionTree
