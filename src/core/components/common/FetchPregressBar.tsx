import { CSSProperties, ReactNode, useEffect } from 'react'
import { useNProgress } from '@tanem/react-nprogress'

const Bar: React.FC<{ animationDuration: number; progress: number; style?: CSSProperties }> = ({ animationDuration, progress, style }) => (
  <div
    className={''}
    style={{
      height: 3,
      left: 0,
      marginLeft: `${(-1 + progress) * 100}%`,
      position: 'absolute',
      background: 'var(--select-color)',
      top: 0,
      transition: `margin-left ${animationDuration}ms linear`,
      width: '100%',
      zIndex: 1031,
      ...style
    }}
  ></div>
)
const Container: React.FC<{
  animationDuration: number
  isFinished: boolean
  children: ReactNode
}> = ({ animationDuration, children, isFinished }) => (
  <div
    style={{
      opacity: isFinished ? 0 : 1,
      pointerEvents: 'none',
      transition: `opacity ${animationDuration}ms linear`,
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%'
    }}
  >
    {children}
  </div>
)

export default ({ isAnimating, style, onProgress }: { isAnimating: boolean; style?: CSSProperties; onProgress?: (p: number) => void }) => {
  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating
  })
  useEffect(() => {
    onProgress?.(progress)
  }, [progress])
  return (
    <Container animationDuration={animationDuration} isFinished={isFinished}>
      <Bar style={style} animationDuration={animationDuration} progress={progress} />
    </Container>
  )
}
