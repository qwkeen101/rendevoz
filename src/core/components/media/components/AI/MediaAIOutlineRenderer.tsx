import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import { IMediaAiSummary } from '~/typings'
import { memo, useEffect, useMemo, useRef } from 'react'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors } from '@/consts'
import classnames from 'classnames'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { useIsIn } from '@/hooks'
import { scrollToElement } from '@/utils'

export default memo(() => {
  const {
    aiSummary,
    currentTime = 0,
    totalTime = 0
  } = useSelectMediaState(s => ({
    currentTime: s.currentTime,
    totalTime: s.totalTime,
    aiSummary: s.aiSummary
  }))
  const ref = useRef<HTMLDivElement>(null)
  const { isIn } = useIsIn(ref)
  if (aiSummary) {
    return (
      <div ref={ref} className={'p-2.5 pt-0 max-h-full overflow-y-auto pb-20'}>
        {aiSummary.outlines.map((i, idx, arr) => (
          <Outline
            canFocus={!isIn}
            showBorderTop={idx > 0}
            nextOutline={arr[idx + 1]}
            key={idx}
            currentTime={currentTime}
            outline={i}
            totalTime={totalTime}
          />
        ))}
      </div>
    )
  }
})
const Outline = ({
  outline,
  currentTime,
  nextOutline,
  totalTime,
  showBorderTop,
  canFocus
}: {
  outline: IMediaAiSummary['outlines'][0]
  currentTime: number
  totalTime: number
  showBorderTop?: boolean
  canFocus: boolean
  nextOutline?: IMediaAiSummary['outlines'][0]
}) => {
  const instance = useMediaInstance()
  const end = nextOutline ? nextOutline.time : totalTime
  const titleRef = useRef<HTMLDivElement>(null)
  const start = outline.time
  const containerRef = useRef<HTMLDivElement>(null)
  const percent = currentTime >= start && currentTime < end ? (currentTime - start) / (end - start) : undefined
  const targetHighlight = useMemo(() => {
    if (percent !== undefined) {
      return outline.highlights.findLastIndex(i => currentTime >= i.time)
    }
  }, [currentTime])
  useEffect(() => {
    if (canFocus) {
      if (percent) {
        if (targetHighlight === undefined || targetHighlight < 0) {
          const t = titleRef.current
          if (t) {
            scrollToElement(t)
          }
        } else {
          const t = containerRef.current?.querySelector(`[data-index="${targetHighlight}"]`)
          if (t) {
            scrollToElement(t)
          }
        }
      }
    }
  }, [targetHighlight])
  return (
    <div className={showBorderTop ? 'pt-3 border-top mt-3' : ''} ref={containerRef}>
      <div
        onClick={() => {
          if (!window.getSelection()?.toString()) {
            instance.actionOps?.jumpTo(start)
          }
        }}
        ref={titleRef}
        className={classnames('flex gap-3 !p-2 !h-auto !rounded-lg button !select-auto items-start')}
      >
        <div
          className={classnames(
            'text-xs mt-1 font-mono font-medium leading-none px-2 py-1 rounded-xl',
            percent ? 'active-button' : 'transparent-font'
          )}
          style={{
            background: Colors.Background.Border
          }}
        >
          {normalizeSecondsToTime(start)}
        </div>
        <div>
          <div className={'font-medium'}>{outline.title}</div>
          <div className={'font-size-12'}>{outline.description}</div>
        </div>
      </div>
      {outline.highlights.map((i, idx) => (
        <div
          data-index={idx}
          onClick={() => {
            if (!window.getSelection()?.toString()) {
              instance.actionOps?.jumpTo(i.time)
            }
          }}
          key={i.time}
          className={'flex gap-3 !select-auto !p-2 !h-auto !rounded-lg button items-start'}
        >
          <div
            className={classnames(
              'text-xs mt-1 transparent-font border font-mono font-medium leading-none px-2 py-1 rounded-xl',
              targetHighlight === idx && 'active-button !border-transparent'
            )}
          >
            {normalizeSecondsToTime(i.time)}
          </div>
          <div>{i.description}</div>
        </div>
      ))}
    </div>
  )
}
