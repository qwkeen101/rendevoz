import { useEffect, useRef, useState } from 'react'
import { XYPosition } from '~/typings'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { IMediaState } from '@/core/components/media/hooks/useMediaState'

type Subtitle = Required<IMediaState>['subtitles'][0]
const useSubtitleSelectAsLabel = (currentSubtitles?: Required<IMediaState>['subtitles']) => {
  const instance = useMediaInstance()
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
      setTimeout(() => {
        const selection = window.getSelection()
        const container = containerRef.current
        if (selection && selection.toString() && container && currentSubtitles && !selection.isCollapsed) {
          const r = selection.getRangeAt(0)
          const anchor = r.startContainer.parentElement
          const focus = r.endContainer.parentElement
          console.log(anchor, focus)
          if (anchor && focus && container.contains(anchor) && container.contains(focus)) {
            const anchorIndex = (anchor as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
            const focusIndex = (focus as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
            if (anchorIndex && focusIndex) {
              const subtitleContainer = (anchor as HTMLElement).closest('[role="subtitle-container"]')
              if (!subtitleContainer) return
              const bounding = selection.getRangeAt(0).getBoundingClientRect()
              const aI = Number(anchorIndex)
              const fI = Number(focusIndex)
              if (aI >= 0 && fI >= 0) {
                const endOffset = (focus.textContent?.length || 0) - r.endOffset
                setTimeout(() => {
                  setAddLabelState({
                    visible: true,
                    position: {
                      x: bounding.x + bounding.width / 2,
                      y: Math.max(bounding.top, subtitleContainer.getBoundingClientRect().top)
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
      })
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
      disableNudge={true}
      content={
        <WithBorder padding={4}>
          <Button.IconButton
            style={{
              padding: '3px 8px',
              fontSize: 14
            }}
            onClick={() => {
              if (addLabelState?.anchorSubtitle && addLabelState.text) {
                window.getSelection()?.empty()
                instance.insertLabel?.(
                  {
                    name: addLabelState.text,
                    time: addLabelState.anchorSubtitle.startTime
                  },
                  false,
                  true
                )
              }
              setAddLabelState(s => ({ ...s, visible: false }))
              setTimeout(() => {
                setAddLabelState(undefined)
              }, 500)
            }}
            text={'Add as label'}
            icon={'park-label'}
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
