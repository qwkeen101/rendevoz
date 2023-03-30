import { Noop } from '@/common/types'
import { AnimatePopover } from '@/components/base'
import { Position } from '@/types'
import { useCallback, useState } from 'react'
import { CustomEditor } from '../../../../../typings/editor/types'
import EditorOverlayElements from './components/EditorOverlayElements'
import { PosHelper } from '@/components/contextMenu'
import EditorMetaQuery from './components/EditorMetaQuery'
import { PopoverPosition } from 'react-tiny-popover'
import { AnimatePresence, motion } from 'framer-motion'
import { css } from '@emotion/css'
import EditorEmojiPicker from './components/EditorEmojiPicker'
import EditorBlockDetails from './components/EditorBlockDetails'
import EditorSelectArea from './components/EditorSelectArea'

const AvalibleOverlayComponents = {
  emojiPicker: 'emojiPicker',
  metaQuery: 'metaQuery',
  blockHandleMenu: 'blockHandleMenu',
  blockDetailsMenu: 'blockDetailsMenu',
  selectArea: 'selectArea'
}
type AvalibleOverlayComponents = keyof typeof AvalibleOverlayComponents
export interface EditorOverlayManager {
  open: Noop
  close: Noop
  setContent: (content: AvalibleOverlayComponents) => void
  setPosition: (position: Position) => void
}
const useEditorOverlay = (editor: CustomEditor, scrollElement?: HTMLDivElement | null) => {
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<Position>()
  const [overlayContent, setOverlayContent] = useState<keyof typeof AvalibleOverlayComponents>()
  const overlayManager: EditorOverlayManager = {
    open: () => setPopoverVisible(true),
    close: () => setPopoverVisible(false),
    setContent: (content: AvalibleOverlayComponents) => setOverlayContent(content),
    setPosition: (position: Position) => setPopoverPosition(position)
  }

  const renderOverlayContent = () => {
    switch (overlayContent) {
      case 'selectArea':
        return <EditorSelectArea editor={editor} scrollElement={scrollElement} />
      case 'metaQuery':
        return <EditorMetaQuery editor={editor} manager={overlayManager} />
      case 'emojiPicker':
        return <EditorEmojiPicker editor={editor} manager={overlayManager} />
      case 'blockHandleMenu':
        return <EditorOverlayElements editor={editor} manager={overlayManager} />
      case 'blockDetailsMenu':
        return <EditorBlockDetails editor={editor} manager={overlayManager} />
    }
  }
  const renderAnimatedOverlay = () => {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={overlayContent}>
          {renderOverlayContent()}
        </motion.div>
      </AnimatePresence>
    )
  }
  const positions = (): PopoverPosition[] => {
    switch (overlayContent) {
      case 'blockHandleMenu':
        return ['left', 'right']
      case 'blockDetailsMenu':
        return ['left', 'right']
      case 'emojiPicker':
        return ['bottom']
      default:
        return ['bottom']
    }
  }
  const align = () => {
    switch (overlayContent) {
      case 'emojiPicker':
        return 'start'
      default:
        return 'start'
    }
  }

  const renderOverlay = () => (
    <AnimatePopover
      containerClassName={css({
        zIndex: 9999
      })}
      onClickOutside={useCallback(() => {
        setPopoverVisible(false)
      }, [])}
      positions={positions()}
      align={align()}
      visible={popoverVisible}
      disableIntersection
      padding={20}
      disableNudge={overlayContent === 'emojiPicker'}
      boundaryElement={document.body}
      boundaryInset={60}
      content={renderAnimatedOverlay()}
    >
      <PosHelper {...popoverPosition} />
    </AnimatePopover>
  )

  return {
    renderOverlay,
    overlayManager,
    popoverVisible
  }
}

export default useEditorOverlay
