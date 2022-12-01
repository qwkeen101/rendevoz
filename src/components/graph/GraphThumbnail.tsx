import { Noop } from '@/common/types'
import { css } from '@emotion/css'
import { MouseEventHandler, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Content, Icon } from '..'

const GraphThumbnail = ({ children, onClose }: { children: ReactNode; onClose: Noop }) => {
  const [small, setSmall] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tempPosRef = useRef({ x: 0, y: 0 })
  const transPosRef = useRef({ x: 0, y: 0 })

  const mouseDownHandler: MouseEventHandler = e => {
    if (e.target === e.currentTarget) {
      tempPosRef.current = {
        x: e.clientX,
        y: e.clientY
      }
      document.addEventListener('mousemove', mouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)
    }
  }
  const mouseMoveHandler = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const { clientX, clientY } = e
      const tempPos = tempPosRef.current
      const container = containerRef.current
      const transPos = transPosRef.current
      if (container && tempPos) {
        const dx = clientX - tempPos.x
        const dy = clientY - tempPos.y
        const tx = transPos.x + dx
        const ty = transPos.y + dy
        container.style.transform = `translateX(${tx}px) translateY(${ty}px)`
      }
    },
    [containerRef]
  )
  const mouseUpHandler = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e
    const tempPos = tempPosRef.current
    const transPos = transPosRef.current
    transPosRef.current = {
      x: clientX - tempPos.x + transPos.x,
      y: clientY - tempPos.y + transPos.y
    }
    document.removeEventListener('mousemove', mouseMoveHandler)
    document.removeEventListener('mouseup', mouseUpHandler)
  }, [])
  const containerClickHandler: MouseEventHandler = e => {
    if (e.currentTarget === e.target) {
      setSmall(true)
    }
  }
  useLayoutEffect(() => {
    if (small) {
      if (containerRef.current) {
        const container = containerRef.current
        const transPos = transPosRef.current
        container.style.transform = `translateX(${transPos.x}px) translateY(${transPos.y}px)`
        const viewport = document.getElementById('viewport')
        if (viewport) {
          //reset viewport transform
          viewport.style.transform = `none`
        }
      }
    } else {
      const viewport = document.getElementById('viewport')
      if (viewport) {
        //reset viewport transform
        viewport.removeAttribute('style')
      }
    }
  }, [small])
  return createPortal(
    <div
      onClick={containerClickHandler}
      role="graph-thumbnail-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: small ? 'none' : 'auto',
        background: !small ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: small ? 300 : '80%',
          height: small ? 200 : '80%',
          right: small ? 100 : undefined,
          top: small ? 100 : undefined,
          background: 'white',
          transition: 'width 0.3s ease,height 0.3s ease',
          pointerEvents: 'auto',
          borderRadius: 6,
          boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
          transform: small ? '' : undefined,
          overflow: 'hidden'
        }}
      >
        {small && (
          <div
            onMouseDown={mouseDownHandler}
            className={css({
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 5,
              opacity: 0,
              borderRadius: 6,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ':hover': {
                opacity: 1,
                background: 'rgba(0,0,0,0.7)'
              },
              transition: 'all 0.3s ease'
            })}
          >
            <div
              className={css({
                position: 'absolute',
                top: 4,
                right: 4,
                padding: 6,
                borderRadius: 999,
                transition: 'all 0.2s ease',
                color: 'white',
                ':hover': {
                  background: 'rgba(255,255,255,0.07)'
                }
              })}
            >
              <Icon cursor="pointer" name="park-close" onClick={onClose} />
            </div>
            <Content
              flex
              gap={10}
              className={css({
                color: 'white',
                transition: 'all 0.3s ease',
                borderRadius: 999,
                padding: '5px 8px',
                cursor: 'pointer',
                ':hover': {
                  background: 'rgba(255,255,255,0.2)'
                }
              })}
              onClick={() => setSmall(false)}
            >
              <Icon cursor="pointer" name="park-stretching" />
              <span>Back to full screen mode</span>
            </Content>
          </div>
        )}
        {!small && <div></div>}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: small ? 'hidden' : 'visible' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
    'graph-thumbnail'
  )
}

export default GraphThumbnail
