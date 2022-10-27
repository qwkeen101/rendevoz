import { FC, MouseEventHandler, ReactNode, useEffect, useState } from 'react'
import styles from './index.module.less'

interface ButtonProps {
  children: ReactNode
  onClick?: MouseEventHandler
  className?: string
  tabIndex?: number
}
export const Button: FC<ButtonProps> = ({ children, onClick, className, tabIndex }) => {
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
      className={`${styles.RippleButton} ${className}`}
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
