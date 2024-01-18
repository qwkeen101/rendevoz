import { useCallback, useEffect, useRef, useState } from 'react'
import { XYPosition } from '~/typings'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { IMediaState } from '@/core/components/media/hooks/useMediaState'
import { defaultRangeExtractor, Range } from '@tanstack/react-virtual'
import { useMemoizedFn } from '@/hooks'

type Subtitle = Required<IMediaState>['subtitles'][0]
const useSubtitleSelectAsLabel = (currentSubtitles?: Required<IMediaState>['subtitles']) => {
  const instance = useMediaInstance()
  const [isSelecting, setIsSelecting] = useState(false)
  const [addLabelState, setAddLabelState] = useState<
    | {
        visible: boolean
        position?: XYPosition
        anchorSubtitle?: Subtitle
        anchorIdx?: number
        focusIdx?: number
        focusSubtitle?: Subtitle
        text?: string
      }
    | undefined
  >({
    visible: false
  })
  const containerRef = useRef<HTMLElement>(null)
  const pointerMoveHandler = useMemoizedFn((e: PointerEvent) => {
    const selection = window.getSelection()
    const container = containerRef.current
    if (selection && selection.toString() && container && currentSubtitles && !selection.isCollapsed) {
      const r = selection.getRangeAt(0)
      const anchor = r.startContainer.parentElement
      const focus = r.endContainer.parentElement
      if (anchor && focus && container.contains(anchor) && container.contains(focus)) {
        const anchorIndex = (anchor as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
        const focusIndex = (focus as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
        if (anchorIndex && focusIndex) {
          const subtitleContainer = (anchor as HTMLElement).closest('[role="subtitle-container"]')
          if (!subtitleContainer) return
          const aI = Number(anchorIndex)
          const fI = Number(focusIndex)
          if (aI >= 0 && fI >= 0) {
            if (aI !== addLabelState?.anchorIdx || fI !== addLabelState?.focusIdx) {
              setAddLabelState(s => ({
                ...s,
                anchorIdx: aI,
                focusIdx: fI
              }))
            }
          }
          return
        }
      }
    }
  })
  useEffect(() => {
    const pointerUpHandler = (e: PointerEvent) => {
      setIsSelecting(false)
      if (addLabelState?.visible) return
      setTimeout(() => {
        const selection = window.getSelection()
        const container = containerRef.current
        if (selection && selection.toString() && container && currentSubtitles && !selection.isCollapsed) {
          const r = selection.getRangeAt(0)
          const anchor = r.startContainer.parentElement
          const focus = r.endContainer.parentElement

          if (anchor && focus && container.contains(anchor) && container.contains(focus)) {
            const subtitleContainer = (anchor as HTMLElement).closest('[role="subtitle-container"]')
            if (!subtitleContainer) return
            const bounding = selection.getRangeAt(0).getBoundingClientRect()
            const aI = addLabelState?.anchorIdx ?? -1
            const fI = addLabelState?.focusIdx ?? -1
            if (aI >= 0 && fI >= 0) {
              const endOffset = (focus.textContent?.length || 0) - r.endOffset
              setTimeout(() => {
                console.log('gt here')
                setAddLabelState({
                  visible: true,
                  anchorIdx: aI,
                  focusIdx: fI,
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
                    .concat(' '.repeat(currentSubtitles[fI].translation?.length ?? 0))
                    .slice(r.startOffset, endOffset ? -endOffset : undefined)
                    .trim()
                })
              }, 10)
            }
            return
          }
        }
      })
    }
    const selectionC = (e: PointerEvent) => {
      if (e.target instanceof HTMLElement) {
        if (containerRef.current?.contains(e.target)) {
          setIsSelecting(true)
        }
      }
    }

    document.addEventListener('pointerdown', selectionC)
    document.addEventListener('pointerup', pointerUpHandler)
    return () => {
      document.removeEventListener('pointerup', pointerUpHandler)
      document.removeEventListener('pointerdown', selectionC)
    }
  })
  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('pointermove', pointerMoveHandler)
      return () => {
        document.removeEventListener('pointermove', pointerMoveHandler)
      }
    }
  }, [isSelecting])

  const rangeExtractor = (range: Range) => {
    if ((isSelecting || addLabelState?.visible) && addLabelState?.anchorIdx !== undefined && addLabelState.focusIdx !== undefined) {
      const arr: number[] = []
      const start = Math.max(0, Math.min(addLabelState.anchorIdx, range.startIndex) - range.overscan)
      const max = Math.min(Math.max(addLabelState.focusIdx, range.endIndex) + range.overscan, range.count - 1)
      for (let i = start; i <= max; i++) {
        arr.push(i)
      }

      console.log(arr)
      return arr
    }
    return defaultRangeExtractor(range)
  }
  const renderPopover = () => (
    <AnimatePopover
      withClickCover={true}
      visible={!!addLabelState?.visible}
      onClickOutside={() => {
        setAddLabelState(s => ({ ...s, visible: false, anchorIdx: undefined, focusIdx: undefined }))
      }}
      boundaryElement={containerRef.current}
      boundaryInset={10}
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
    containerRef,
    rangeExtractor
  }
}

export default useSubtitleSelectAsLabel
