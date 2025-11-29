import useMediaState from '@/core/components/media/hooks/useMediaState'
import { IMediaAiSummary } from '~/typings'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors } from '@/consts'
import classnames from 'classnames'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { Icon } from '@/components'
import { useIsIn } from '@/hooks'
import { scrollToElement } from '@/utils'

export default memo(({ active }: { active: boolean }) => {
  const [mediaState] = useMediaState()
  const { aiSummary, currentTime = 0, totalTime = 0 } = mediaState
  const ref = useRef<HTMLDivElement>(null)
  const { isIn } = useIsIn(ref)
  if (aiSummary) {
    return (
      <div ref={ref} className={classnames('px-3 py-4 pt-0 max-h-full overflowYAuto', !active && 'hidden')}>
        {aiSummary.outlines.map((i, idx, arr) => (
          <Outline
            canFocus={!isIn && active}
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
  const [collapsed, setCollapsed] = useState(false)
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
          instance.actionOps?.jumpTo(start)
        }}
        ref={titleRef}
        className={classnames('flex gap-3 !p-2 !h-auto !rounded-lg button items-start')}
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
          <div className={'font-size-16'}>{outline.title}</div>
          <div className={'font-size-12 mt-1'}>{outline.description}</div>
        </div>
        {outline.highlights.length ? (
          <div className={'ml-auto pr-2'}>
            <Icon
              className={classnames('icon-16 transition-transform', collapsed && 'rotate-180')}
              onClick={e => {
                e.stopPropagation()
                setCollapsed(!collapsed)
              }}
              strokeWidth={4}
              name={'park-up'}
            />
          </div>
        ) : null}
      </div>
      {!collapsed &&
        outline.highlights.map((i, idx) => (
          <div
            data-index={idx}
            onClick={() => {
              instance.actionOps?.jumpTo(i.time)
            }}
            key={i.time}
            className={'flex gap-3 !p-2 !h-auto !rounded-lg button items-center'}
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
