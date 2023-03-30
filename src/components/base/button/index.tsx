import { css } from '@emotion/css'
import classNames from 'classnames'
import { CSSProperties, FC, MouseEventHandler, ReactNode, useEffect, useState } from 'react'
import IconButton from './IconButton'
import styles from './index.module.less'

interface ButtonProps {
  children: ReactNode
  onClick?: MouseEventHandler
  className?: string
  tabIndex?: number
  style?: CSSProperties
}
interface IButton extends FC<ButtonProps>{
  IconButton: typeof IconButton
}
export const Button: IButton = ({ children, onClick, className, tabIndex, style }) => {
  const [coords, setCoords] = useState({ x: -1, y: -1 })
  const [isRippling, setIsRippling] = useState(false)

  useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1 && !isRippling) {
      setIsRippling(true)
      setTimeout(() => setIsRippling(false), 600)
    } else setIsRippling(false)
  }, [coords])

  useEffect(() => {
    if (!isRippling) setCoords({ x: -1, y: -1 })
  }, [isRippling])

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className={classNames(
        css({
          position: 'relative',
          boxShadow: '0 0 0.5rem rgba(0, 0, 0, 0.3)',
          outline: 'none',
          overflow: 'hidden',
          color: '#fff',
          background: '#8590ae',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          ':focus': {
            boxShadow: '0 0 1rem rgba(0,0,0,0.3)'
          }
        }),
        className
      )}
      style={style}
      onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        onClick?.(e)
      }}
    >
      {isRippling ? (
        <span
          className={styles.ripple}
          style={{
            left: coords.x,
            top: coords.y
          }}
        />
      ) : (
        ''
      )}
      <span className={styles.content}>{children}</span>
    </button>
  )
}

Button.IconButton = IconButton
