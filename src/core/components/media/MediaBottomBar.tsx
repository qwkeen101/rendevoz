import { Icon } from '@/components'
import { useMediaInstance } from './hooks/useMediaInstance'
import useMediaState from './hooks/useMediaState'
import { CSSProperties, useRef } from 'react'
import useMediaToolbarState from './hooks/useMediaToolbarState'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import useRenderMediaControlBar from './useRenderMediaControlBar'

const CLAZZ = 'opacity-80 hover:opacity-100 transition-opacity cursor-pointer'
const MediaBottomBar = ({
  style,
  className,
  controlBarStyle
}: {
  style?: CSSProperties
  className?: string
  controlBarStyle?: CSSProperties
}) => {
  const [mediaState, setMediaState] = useMediaState()
  const [toolbarState, setToolbarState] = useMediaToolbarState()
  const { paused } = mediaState
  const { draggingScrubber } = toolbarState

  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { renderPlayButton, renderController, renderCurrentTime, renderSpeed, renderTotalTime, renderVolume } = useRenderMediaControlBar()
  const opacity = !mediaState.labelPopoverVisible && (paused || draggingScrubber) ? 1 : 0
  return (
    <div
      ref={containerRef}
      style={{
        ...style
      }}
      className={classnames(className, 'text-white relative')}
    >
      <div
        style={{
          height: 267,
          position: 'absolute',
          width: '100%',
          bottom: 0,
          left: 0,
          paddingTop: 37,
          backgroundRepeat: 'repeat-x',
          backgroundImage:
            'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAELCAYAAAAY+exbAAAAAXNSR0IArs4c6QAAASpJREFUOE9lyOdHqAEARvH2rtve47b33nvv4XIlkkQSSSKJJJFEkkgiSSSR/sic98vx6vnw4zwREb8WySNRpESTEkNKLClxpMSTkkBKIilJZEBymBRSUklJI+UPKemkZJCSSUoWGZAdJoeUXFLySMknpYCUQlKKSCkmpYQMKA1TRspfUspJqSClkpQqUqpJqSGllgyoC1NPSgMpjaQ0kdJMSgspraS0kQHtYTpI6SSli5RuUnpI6SWlj5R+UgbIgMEwQ6QMkzJCyigpY6SMkzJByiQZMBVmmpQZUmZJmSNlnpQFUhZJWSJlmVyBf/AfVmEN1mEDNmELtmEHdmEP9uEADuEIjuEETuEMzuECLuEKruEGbuEO7uEBHuEJnuEFXuEN3uEDPuELvn8AQr82DJxd5k4AAAAASUVORK5CYII=")'
        }}
      ></div>
      {renderController()}
      <div
        style={{
          ...controlBarStyle,
          ...mediaState.styles?.controlBarStyle
        }}
        className='flex p-4 relative justify-between items-center z-20'
      >
        <div className='flex gap-6'>
          {renderPlayButton({
            className: CLAZZ,
            size: 24
          })}
          {renderVolume({
            iconClassname: CLAZZ,
            iconSize: 22
          })}
          <div
            style={{
              letterSpacing: '-0.4px'
            }}
            className={'flex gap-1.5 items-center font-bold font-size-12 opacity-80'}
          >
            {renderCurrentTime({ className: '' })}
            <div>/</div>
            {renderTotalTime({ className: '' })}
          </div>
        </div>
        <div className={'flex items-center gap-7'}>
          {renderSpeed({
            className: classnames(CLAZZ, 'mr-1'),
            size: 20
          })}
          {mediaState.subtitleList?.length ? (
            <Icon
              onClick={() => {
                setMediaState(s => ({ ...s, showSubtitle: !s.showSubtitle }))
              }}
              className={CLAZZ}
              size={20}
              name='custom-CC'
            />
          ) : null}
          <Icon
            onClick={() => {
              setMediaState(s => ({ ...s, focus: { ...s.focus, visible: true } }))
            }}
            className={classnames(CLAZZ, 'mr-1')}
            strokeWidth={4}
            size={20}
            name='park-stretching'
          />
        </div>
      </div>
    </div>
  )
}

export default MediaBottomBar
