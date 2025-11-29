import useMediaState from '@/core/components/media/hooks/useMediaState'
import { Icon, Slider, AnimatePopover, WithBorder, Menu } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { Icons } from '@/consts'
import MediaProgressLabelPin from '@/core/components/media/MediaProgressLabelPin'
import MediaChapter from '@/core/components/media/components/sidebar/MediaChapter'
import MediaScrubber from '@/core/components/media/components/MediaScrubber'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import useMediaToolbarState from '@/core/components/media/hooks/useMediaToolbarState'
import { useIsIn } from '@/hooks'
import classNames from 'classnames'

export default () => {
  const [mediaState, setMediaState] = useMediaState()
  const [toolbarState, setToolbarState] = useMediaToolbarState()
  const instance = useMediaInstance()
  const renderPrevButton = (opts?: { className?: string; size?: number }) => {
    return (
      <Icon
        size={opts?.size ?? 18}
        className={opts?.className ?? 'square-button'}
        name={'custom-prev-song'}
        onClick={() => {
          instance.on?.({ type: 'onNavigate', direction: 'prev' })
        }}
      />
    )
  }
  const renderNextButton = (opts?: { className?: string; size?: number }) => {
    return (
      <Icon
        size={opts?.size ?? 18}
        className={opts?.className ?? 'square-button'}
        name={'custom-next-song'}
        onClick={() => {
          instance.on?.({ type: 'onNavigate', direction: 'next' })
        }}
      />
    )
  }

  const renderSpeed = (opts?: { className?: string; size?: number; spin?: boolean }) => {
    return (
      <AnimatePopover
        positions={['top']}
        padding={10}
        content={setV => (
          <WithBorder className={'py-1'}>
            <Menu.NavigationMenu
              onSelect={i => {
                setMediaState(s => ({ ...s, speed: Number(i.key) }))
                setV(false)
              }}
              layout={[
                {
                  type: 'title',
                  name: 'Playback speed'
                },
                ...[3, 2, 1.75, 1.5, 1.25, 1, 0.75, 0.5].map(i => ({
                  type: 'item',
                  key: i.toString(),
                  text: `${i}x`
                }))
              ]}
            />
          </WithBorder>
        )}
      >
        <div className={classNames('relative', opts?.className)}>
          <div style={{ letterSpacing: '-1px' }} className='absolute -top-2.5 right-1 translate-x-full z-10 font-bold font-size-10'>
            {mediaState.speed ?? 1}x
          </div>
          <Icon size={opts?.size} theme={'filled'} name={'park-speed'} />
        </div>
      </AnimatePopover>
    )
  }

  const renderPlayButton = (opts?: { className?: string; size?: number; spin?: boolean }) => {
    const { loaded, paused } = mediaState
    return (
      <Icon
        className={opts?.className ?? 'square-button'}
        size={opts?.size ?? 18}
        strokeWidth={loaded || opts?.spin === false ? 8 : undefined}
        spin={!loaded && opts?.spin !== false}
        name={loaded || opts?.spin === false ? (paused ? 'park-play-one' : 'park-pause') : Icons.Loading}
        onClick={() => {
          if (loaded) {
            setMediaState(s => ({ ...s, paused: !s.paused }))
          }
        }}
        theme='filled'
      />
    )
  }

  const controllerRef = useRef<HTMLDivElement>(null)
  const renderController = (opts?: { progressStyle?: CSSProperties; width?: number; loadBg?: string }) => {
    const { styles, totalTime } = mediaState
    return (
      <div
        ref={controllerRef}
        style={{
          height: styles?.progressHeight ?? 4,
          width: opts?.width
        }}
        className={'z-50 w-full flex relative'}
      >
        {mediaState.labels?.map(i => <MediaProgressLabelPin labelId={i} key={i} />)}
        <MediaChapter progressStyle={opts?.progressStyle} loadBg={opts?.loadBg} startTime={0} endTime={totalTime} />
        <MediaScrubber parentRef={controllerRef} />
      </div>
    )
  }

  const renderCurrentTime = (opts?: { className: string }) => {
    return (
      <div className={opts?.className ?? 'font-size-12 transparent-font'}>
        {DateFormat.formatDuration((toolbarState.draggingScrubber ? toolbarState.currentScrubberTime : mediaState.currentTime) ?? 0)}
      </div>
    )
  }

  const { isIn, ref } = useIsIn()
  const [volumeFocused, setFocused] = useState(false)
  useEffect(() => {
    const pUp = (e: PointerEvent) => {
      const target = e.target
      if (target instanceof HTMLElement) {
        if (!ref.current?.contains(target)) {
          setFocused(false)
        }
      }
    }
    if (volumeFocused) {
      document.addEventListener('pointerup', pUp)
      return () => {
        document.removeEventListener('pointerup', pUp)
      }
    }
  }, [volumeFocused])
  const renderVolume = (opts?: { iconClassname?: string; iconSize?: number; style?: CSSProperties; width?: number }) => {
    const { volume = 0, muted } = mediaState
    const visible = volumeFocused || isIn
    return (
      <div style={opts?.style} ref={ref} className={'flex gap-4 items-center'}>
        <Icon
          size={opts?.iconSize ?? 18}
          className={opts?.iconClassname ?? 'square-button'}
          onClick={() => setMediaState(s => ({ ...s, muted: !s.muted }))}
          name={volume === 0 || muted ? 'park-volume-mute' : volume < 0.3 ? 'park-volume-small' : 'park-volume-notice'}
        />
        <Slider
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          handleStyle={{
            display: visible ? undefined : 'none',
            backgroundColor: 'rgba(255, 255, 255)',
            width: 10,
            height: 10,
            marginTop: -3
          }}
          trackStyle={{
            backgroundColor: visible ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
            height: 4
          }}
          railStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            height: 4
          }}
          value={muted ? 0 : volume}
          onChange={v => {
            typeof v === 'number' && setMediaState(s => ({ ...s, volume: v, muted: false }))
          }}
          min={0}
          max={0.6}
          step={0.02}
          style={{
            width: opts?.width ?? 60
          }}
        />
      </div>
    )
  }

  const renderTotalTime = (opts?: { className: string }) => {
    return <div className={opts?.className ?? 'font-size-12 transparent-font'}>{DateFormat.formatDuration(mediaState.totalTime ?? 0)}</div>
  }

  return {
    renderNextButton,
    renderPrevButton,
    renderPlayButton,
    renderController,
    renderTotalTime,
    renderCurrentTime,
    renderVolume,
    renderSpeed
  }
}
