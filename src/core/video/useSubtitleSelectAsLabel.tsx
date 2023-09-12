import { useEffect, useRef, useState } from 'react'
import { XYPosition } from '~/typings'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'
import { VideoState } from '@/core/video/hooks/useVideoState'

type Subtitle = Required<VideoState>['subtitles'][0]
const useSubtitleSelectAsLabel = (currentSubtitles?: Required<VideoState>['subtitles']) => {
  const instance = useVideoInstance()
  const [addLabelState, setAddLabelState] = useState<
    | {
        visible: boolean
        position?: XYPosition
        anchorSubtitle?: Subtitle
        focusSubtitle?: Subtitle
        text?: string
      }
    | undefined
  >({
    visible: false
  })
  const containerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const pointerUpHandler = (e: PointerEvent) => {
      const selection = window.getSelection()
      const container = containerRef.current
      if (selection && container && currentSubtitles && !selection.isCollapsed) {
        const r = selection.getRangeAt(0)
        const anchor = r.startContainer.parentElement
        const focus = r.endContainer.parentElement
        console.log(anchor, focus)
        if (anchor && focus && container.contains(anchor) && container.contains(focus)) {
          const anchorIndex = (anchor as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
          const focusIndex = (focus as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
          if (anchorIndex && focusIndex) {
            const bounding = selection.getRangeAt(0).getBoundingClientRect()
            const aI = Number(anchorIndex)
            const fI = Number(focusIndex)
            if (aI && fI) {
              const endOffset = (focus.textContent?.length || 0) - r.endOffset
              setTimeout(() => {
                setAddLabelState({
                  visible: true,
                  position: {
                    x: bounding.x + bounding.width / 2,
                    y: bounding.top
                  },
                  anchorSubtitle: currentSubtitles[aI],
                  focusSubtitle: currentSubtitles[fI],
                  text: currentSubtitles
                    ?.slice(aI, fI + 1)
                    .map(i => i.text)
                    .join(' ')
                    .slice(r.startOffset, endOffset ? -endOffset : undefined)
                })
              }, 10)
            }
            return
          }
        }
      }
    }
    document.addEventListener('pointerup', pointerUpHandler)
    return () => {
      document.removeEventListener('pointerup', pointerUpHandler)
    }
  })
  const renderPopover = () => (
    <AnimatePopover
      visible={addLabelState?.visible}
      onClickOutside={() => {
        setAddLabelState(s => ({ ...s, visible: false }))
        setTimeout(() => {
          setAddLabelState(s => (s?.visible ? s : undefined))
        }, 300)
      }}
      boundaryElement={containerRef.current}
      boundaryInset={10}
      parentElement={containerRef.current}
      padding={10}
      content={
        <WithBorder padding={4}>
          <Button.IconButton
            onClick={() => {
              console.log(addLabelState)
              if (addLabelState?.anchorSubtitle && addLabelState.text) {
                instance.insertLabel?.(
                  {
                    name: addLabelState.text,
                    videoTime: addLabelState.anchorSubtitle.startTime
                  },
                  false,
                  true
                )
              }
              setAddLabelState(s => ({ ...s, visible: false }))
              setTimeout(() => {
                setAddLabelState(undefined)
              }, 300)
            }}
            text={'Add as label'}
            icon={'park-plus'}
          />
        </WithBorder>
      }
      position={{
        left: addLabelState?.position?.x,
        top: addLabelState?.position?.y
      }}
      positions={['top', 'bottom']}
    ></AnimatePopover>
  )
  return {
    renderPopover,
    containerRef
  }
}

export default useSubtitleSelectAsLabel
