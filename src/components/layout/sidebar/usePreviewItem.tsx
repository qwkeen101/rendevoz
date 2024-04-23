import { useIsIn } from '@/hooks'
import { ReactElement, RefObject, useEffect, useRef, useState } from 'react'
import { useLatest } from 'react-use'
import { AnimatePopover, WithBorder } from '@/components'
import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import { css } from '@emotion/css'

export default (canPreview: boolean, metaId: number) => {
  const { ref, isIn } = useIsIn(undefined, { pointerMove: false })
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [isInContent, setIsInContent] = useState(false)
  const realIsIn = isIn || isInContent
  const latestIsIn = useLatest(realIsIn)
  const disablePopoverRef = useRef(false)
  useEffect(() => {
    if (!canPreview) return
    if (realIsIn) {
      setTimeout(() => {
        if (latestIsIn.current) {
          if (disablePopoverRef.current) {
            disablePopoverRef.current = false
            return
          }
          setPopoverVisible(true)
        }
      }, 400)
      const pointerDownHandler = () => {
        setTimeout(() => setPopoverVisible(false))
        disablePopoverRef.current = true
      }
      ref.current?.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        ref.current?.removeEventListener('pointerdown', pointerDownHandler)
      }
    } else {
      setTimeout(() => {
        if (!latestIsIn.current) {
          disablePopoverRef.current = false
          setPopoverVisible(false)
        }
      }, 200)
    }
  }, [realIsIn])
  const wrapper = (children: ReactElement) => (
    <AnimatePopover
      innerRef={ref}
      visible={popoverVisible}
      positions={['right']}
      align={'start'}
      padding={-5}
      content={
        <WithBorder
          onPointerEnter={() => {
            setIsInContent(true)
          }}
          onPointerLeave={() => {
            setIsInContent(false)
          }}
          className={css({
            display: 'flex',
            ':has(> :empty)': {
              display: 'none'
            }
          })}
          onPointerDown={e => e.stopPropagation()}
          style={{ width: 300, maxHeight: 300, flexDirection: 'column', minHeight: 100 }}
        >
          <InnerContentDisplayer
            metaId={metaId}
            scrollableNote
            mode={'content'}
            containerStyle={{
              borderRadius: 6,
              display: 'flex',
              width: '100%',
              overflow: 'auto',
              flexDirection: 'column',
              height: 0,
              flex: 1
            }}
          />
        </WithBorder>
      }
    >
      {children}
    </AnimatePopover>
  )
  return { ref, wrapper }
}
