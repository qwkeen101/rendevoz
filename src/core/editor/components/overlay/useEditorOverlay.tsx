import { Noop } from '@/common/types'
import { AnimatePopover } from '@/components/base'
import { useCallback, useEffect, useState } from 'react'
import { CustomEditor, LeftTopPosition } from '~/typings'
import EditorOverlayElements from './components/EditorOverlayElements'
import EditorMetaQuery from './components/EditorMetaQuery'
import { PopoverPosition } from 'react-tiny-popover'
import EditorEmojiPicker from './components/EditorEmojiPicker'
import EditorBlockDetails from './components/EditorBlockDetails'
import EditorSelectArea from './components/EditorSelectArea'
import EditorLinkForm from './components/EditorLinkForm'
import { KEY, Zindexes } from '@/consts'
import isHotkey from 'is-hotkey'
import { useUpdate } from 'react-use'

const AvalibleOverlayComponents = {
  emojiPicker: 'emojiPicker',
  metaQuery: 'metaQuery',
  blockHandleMenu: 'blockHandleMenu',
  blockDetailsMenu: 'blockDetailsMenu',
  selectArea: 'selectArea',
  slashMenu: 'slashMenu',
  linkForm: 'linkForm'
}
type AvalibleOverlayComponents = keyof typeof AvalibleOverlayComponents
export interface EditorOverlayManager {
  open: Noop
  close: Noop
  setContent: (content: AvalibleOverlayComponents) => void
  setPosition: (position: LeftTopPosition) => void
  getContent: () => keyof typeof AvalibleOverlayComponents | undefined
  isOpen: () => boolean
  setCurrentLink?: (link: string) => void
}
const useEditorOverlay = (editor: CustomEditor, scrollElement?: HTMLDivElement | null) => {
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<LeftTopPosition>()
  const [overlayContent, setOverlayContent] = useState<keyof typeof AvalibleOverlayComponents>()
  const overlayManager: EditorOverlayManager = {
    open: () => setPopoverVisible(true),
    close: () => setPopoverVisible(false),
    setContent: (content: AvalibleOverlayComponents) => setOverlayContent(content),
    setPosition: (position: LeftTopPosition) => setPopoverPosition(position),
    getContent: () => overlayContent,
    isOpen: () => popoverVisible
  }
  const update = useUpdate()
  const renderOverlayContent = () => {
    switch (overlayContent) {
      case 'selectArea':
        return <EditorSelectArea editor={editor} scrollElement={scrollElement} />
      case 'metaQuery':
        return <EditorMetaQuery editor={editor} manager={overlayManager} />
      case 'emojiPicker':
        return <EditorEmojiPicker editor={editor} manager={overlayManager} />
      case 'blockHandleMenu':
        return <EditorOverlayElements editor={editor} manager={overlayManager} mode="block" />
      case 'blockDetailsMenu':
        return <EditorBlockDetails editor={editor} manager={overlayManager} />
      case 'slashMenu':
        return <EditorOverlayElements editor={editor} manager={overlayManager} mode="slash" />
      case 'linkForm':
        return <EditorLinkForm editor={editor} manager={overlayManager} />
    }
  }
  const renderAnimatedOverlay = () => {
    return renderOverlayContent()
  }
  const positions = (): PopoverPosition[] => {
    switch (overlayContent) {
      case 'blockHandleMenu':
        return ['left', 'right']
      case 'blockDetailsMenu':
        return ['left', 'right']
      case 'emojiPicker':
        return ['bottom', 'top']
      case 'slashMenu':
        return ['right', 'top']
      default:
        return ['bottom']
    }
  }
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e)) {
        overlayManager.close()
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
  const align = () => {
    switch (overlayContent) {
      case 'emojiPicker':
        return 'start'
      case 'slashMenu':
        return 'center'
      default:
        return 'start'
    }
  }
  useEffect(() => {
    if (overlayContent === 'emojiPicker') {
      setTimeout(() => {
        update()
      })
    }
  }, [overlayContent, popoverVisible])
  const renderOverlay = () => (
    <AnimatePopover
      containerStyle={{ zIndex: String(Zindexes.EditorSelectionToolbar) }}
      onClickOutside={useCallback(() => {
        setPopoverVisible(false)
      }, [])}
      positions={positions()}
      align={align()}
      visible={popoverVisible}
      padding={20}
      reposition
      disableNudge={overlayContent === 'emojiPicker' || overlayContent === 'blockHandleMenu' || overlayContent === 'slashMenu'}
      boundaryElement={document.body}
      boundaryInset={20}
      content={renderAnimatedOverlay()}
      position={{
        left: popoverPosition?.left,
        top: popoverPosition?.top
      }}
    ></AnimatePopover>
  )

  return {
    renderOverlay,
    overlayManager,
    popoverVisible
  }
}

export default useEditorOverlay
