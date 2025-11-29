import { memo, useRef, useState } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import classnames from 'classnames'
import { Icon } from '@/components'
import FocusVideoBottom from '@/core/components/media/components/focus/video/FocusVideoBottom'
import FocusVideoBody from '@/core/components/media/components/focus/video/FocusVideoBody'
import './focus.less'
import FocusSidebar from '@/core/components/media/components/focus/FocusSidebar'
import FocusSettings from './settings/FocusSettings'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
const BACKGROUND_BASE = '#0f0f0f'
const BUTTON_CLASS = 'text-white opacity-70 hover:opacity-80 cursor-pointer transition-opacity'

export default memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const { layout, focus } = mediaState

  const focusDetails = typeof layout?.focusMode === 'object' ? layout.focusMode : undefined

  return createPortal(
    <AnimatePresence>
      {focus?.visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            bounce: 0
          }}
          className={'fixed inset-0 flex flex-col overflow-hidden size-full text-white'}
          style={{
            zIndex: 1000,
            background: BACKGROUND_BASE,
            '--font-transparent': 'rgba(255, 255, 255, 0.6)',
            ...focusDetails?.style
          }}
        >
          <Icon
            strokeWidth={4.5}
            size={13}
            style={{
              appRegion: 'no-drag'
            }}
            className={
              'absolute z-50 transition-opacity hover:opacity-100 top-6 right-6 cursor-pointer border rounded-lg p-2 text-neutral-200 bg-neutral-800 opacity-70'
            }
            onClick={() => {
              setMediaState(s => ({ ...s, focus: { ...s.focus, visible: false } }))
            }}
            name={'park-close'}
          />
          <FocusSettings />
          <FocusSidebar />
          <FocusVideoBody />
          <FocusVideoBottom BUTTON_CLASS={BUTTON_CLASS} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
})
