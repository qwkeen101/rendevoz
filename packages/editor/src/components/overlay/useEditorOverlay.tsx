import { Noop } from '@/common/types'
import { AnimatePopover } from '@/components/base'
import { useEffect, useState } from 'react'
import { CustomEditor, IEditorOverlayContent, LeftTopPosition, XYPosition } from '~/typings'
import EditorOverlayElements from './components/EditorOverlayElements'
import { PopoverPosition } from 'react-tiny-popover'
import EditorEmojiPicker from './components/EditorEmojiPicker'
import EditorBlockMenu from '../blockMenu/EditorBlockMenu'
import EditorLinkForm from './components/EditorLinkForm'
import { KEY, Zindexes } from '@/consts'
import isHotkey from 'is-hotkey'
import { atom, useAtom } from 'jotai'
import { assignProperties } from '@/utils'
import useEditorInstance from '../hooks/useEditorInstance'
import EditorTransformMenu from '../components/overlay/components/EditorTransformMenu'

const AvalibleOverlayComponents = {
  emojiPicker: 'emojiPicker',
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
export const EditorOverlayStateAtom = atom<{
  visible: boolean
  position?: XYPosition
  content?: IEditorOverlayContent
  currentFilterValue?: string
}>({
  visible: false
})
const useEditorOverlay = (editor: CustomEditor, scrollElement?: HTMLDivElement | null) => {
  const [overlayState, setOverlayState] = useAtom(EditorOverlayStateAtom)
  const [popoverVisible, setPopoverVisible] = useState(false)
  const instance = useEditorInstance()
  assignProperties(instance, {
    overlayOps: {
      open: (content, position) => {
        // @ts-ignore
        setOverlayState(s => ({
          visible: true,
          position: position,
          content,
          currentFilterValue: undefined
        }))
      },
      getState: () => overlayState,
      close: () => {
        console.log('close')
        setOverlayState(s => ({ ...s, visible: false }))
      }
    }
  })
  const overlayManager: EditorOverlayManager = {
    open: () => setPopoverVisible(true),
    close: () => setPopoverVisible(false),
    getContent: () => overlayContent,
    isOpen: () => popoverVisible
  }

  const overlayContent = overlayState.content
  const renderOverlayContent = () => {
    switch (overlayContent) {
      case 'emojiPicker':
        return <EditorEmojiPicker editor={editor} manager={overlayManager} />
      case 'blockHandleMenu':
        return <EditorOverlayElements editor={editor} mode="block" />
      case 'blockDetailsMenu':
        return <EditorBlockMenu editor={editor} manager={overlayManager} />
      case 'slashMenu':
        return <EditorOverlayElements editor={editor} mode="slash" />
      case 'linkForm':
        return <EditorLinkForm editor={editor} manager={overlayManager} />
      case 'transformMenu':
        return <EditorTransformMenu />
    }
  }
  const positions = (): PopoverPosition[] => {
    switch (overlayContent) {
      case 'blockDetailsMenu':
        return ['left', 'right']
      case 'emojiPicker':
        return ['bottom', 'top']
      case 'blockHandleMenu':
      case 'slashMenu': {
        const height = window.innerHeight * 0.4
        if ((overlayState.position?.y ?? 0) + height + 20 > window.innerHeight) {
          return ['top', 'bottom']
        }
        return ['bottom', 'top']
      }
      default:
        return ['bottom', 'top']
    }
  }
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e)) {
        instance.overlayOps?.close()
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
  const align = () => {
    switch (overlayContent) {
      case 'transformMenu':
        return 'center'
      case 'emojiPicker':
        return 'start'
      case 'blockHandleMenu':
        return 'start'
      case 'slashMenu':
        return 'start'
      case 'linkForm':
        return 'center'
      default:
        return 'start'
    }
  }

  const renderOverlay = () => (
    <AnimatePopover
      containerStyle={{ zIndex: String(Zindexes.EditorSelectionToolbar + 5) }}
      onClickOutside={() => {
        setOverlayState(s => ({ ...s, visible: false }))
      }}
      withClickCover={overlayContent !== 'selectArea'}
      positions={positions()}
      align={align()}
      visible={overlayState.visible}
      padding={20}
      reposition
      boundaryElement={document.body}
      boundaryInset={20}
      content={renderOverlayContent()}
      position={{
        left: overlayState.position?.x,
        top: overlayState.position?.y
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
