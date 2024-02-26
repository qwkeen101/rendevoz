import { useMemo, useState } from 'react'
import { Content, Modal } from '@/components'
import { Media } from '@/core'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import MediaCore from '@/core/components/media/MediaCore'
import { Resizable } from 're-resizable'
import { Rnd } from 'react-rnd'

export default () => {
  const [mediaState] = useMediaState()
  const [clipperState, setClipperState] = useState<{
    visible: boolean
    startTime?: number
    endTime?: number
    currTime?: number
  }>({ visible: false, currTime: 40, startTime: 30, endTime: 50 })
  const duration = mediaState.totalTime
  const currTimeOffset = clipperState.currTime !== undefined && duration !== undefined ? clipperState.currTime / duration : undefined
  const initialOffset = useMemo(() => {
    if (clipperState.currTime !== undefined && duration !== undefined) {
      const min = Math.max(0, clipperState.startTime ?? clipperState.currTime - 10)
      const max = Math.min(duration, clipperState.endTime ?? clipperState.currTime + 10)
      return {
        min: min / duration,
        max: max / duration,
        width: (max - min) / duration
      }
    }
  }, [clipperState, duration])
  return (
    <Modal visible={clipperState.visible} onClose={() => setClipperState({ visible: false })}>
      <Content style={{ width: 600 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 8
          }}
        >
          {initialOffset && (
            <Rnd
              // size={{
              //   width: `${initialOffset.width * 100}%`,
              //   height: '100%'
              // }}
              handleStyles={{
                left: {},
                right: {}
              }}
              dragAxis={'x'}
              bounds={'parent'}
              // onResize={(event, direction, elementRef, delta) => {
              //   const currWidth = elementRef.clientWidth
              //   const parWidth = elementRef.parentElement!.clientWidth
              //   const ratio = (currWidth / parWidth) * 100
              //   if (direction === 'left') {
              //     const initialLeft = initialOffset.min * parWidth
              //     const deltaLeft = initialLeft - delta.width
              //     elementRef.style.left = `${deltaLeft}px`
              //   }
              // }}
              // onResizeStop={(event, direction, elementRef, delta) => {
              //   const currWidth = elementRef.clientWidth
              //   const parWidth = elementRef.parentElement!.clientWidth
              //   const ratio = currWidth / parWidth
              //   const min = elementRef.offsetLeft / parWidth
              //   setClipperState(s => ({
              //     ...s,
              //     endTime: min * duration! + ratio * duration!,
              //     startTime: min * duration!
              //   }))
              // }}
              default={{
                x: initialOffset.min * 600,
                y: 0,
                width: `${initialOffset.width * 100}%`,
                height: '100%'
              }}
              style={{
                background: 'black'
              }}
              enableResizing={{ left: true, right: true }}
            ></Rnd>
          )}
          {currTimeOffset && (
            <div
              style={{
                position: 'absolute',
                left: `${currTimeOffset * 100}%`,
                top: 0
              }}
            ></div>
          )}
        </div>
      </Content>
    </Modal>
  )
}
