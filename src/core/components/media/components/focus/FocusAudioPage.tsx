import { memo, useRef, useState } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import classnames from 'classnames'
import { Icon, IconWithPopover, Markdown } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import FocusAudioBottom from '@/core/components/media/components/focus/audio/FocusAudioBottom'
import FocusAudioBody from '@/core/components/media/components/focus/audio/FocusAudioBody'

const BACKGROUND_BASE = 'rgb(28, 28, 28)'
const BUTTON_CLASS = 'text-white opacity-60 hover:opacity-80 cursor-pointer transition-opacity'

export default memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const { layout } = mediaState

  const focusDetails = typeof layout?.focusMode === 'object' ? layout.focusMode : undefined

  return (
    <div
      className={'fixed inset-0 flex flex-col overflow-hidden size-full text-white'}
      style={{
        zIndex: 100,
        background: BACKGROUND_BASE,
        '--font-transparent': 'rgba(255, 255, 255, 0.6)',
        ...focusDetails?.style
      }}
    >
      <Icon
        name={'park-down'}
        strokeWidth={4}
        onClick={focusDetails?.onClose}
        className={classnames('absolute top-2.5 left-24', BUTTON_CLASS)}
        size={24}
      />
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgb(108, 108, 108)',
          height: 240,
          zIndex: -1,
          top: 0,
          left: 0,
          position: 'absolute',
          backgroundImage: `linear-gradient(rgba(0,0,0,.6) 0,${BACKGROUND_BASE} 100%)`
        }}
      ></div>
      <FocusAudioBody />
      <FocusAudioBottom BUTTON_CLASS={BUTTON_CLASS} />
    </div>
  )
})
