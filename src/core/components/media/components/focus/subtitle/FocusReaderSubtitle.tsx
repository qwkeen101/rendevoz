import useMediaSubtitle from '@/core/components/media/components/focus/subtitle/useMediaSubtitle'
import { CSSProperties, memo, ReactNode, useEffect, useMemo, useState } from 'react'
import { IMediaSubtitle } from '~/typings'
import { useIsIn } from '@/hooks'
import { Icon } from '@/components'
import classnames from 'classnames'
import { useMediaInstance } from '../../../hooks/useMediaInstance'
import { EmptyList } from '@/core/components/common'
import useFocusSettings from '../useFocusSettings'

export default memo(
  ({ style, className, subtitleClassName }: { style?: CSSProperties; className?: string; subtitleClassName?: string }) => {
    const mode = useFocusSettings()[0].subtitleMode
    const [isIntersec, setIntersec] = useState(true)
    const { renderPopover, containerRef, highlighted, currentSubtitleIndex, currentSubtitle } = useMediaSubtitle()

    useEffect(() => {
      setIntersec(false)
    }, [mode])

    useEffect(() => {
      const container = containerRef.current
      if (container && currentSubtitleIndex >= 0 && isIntersec) {
        const target = container.querySelector(`[data-subtitle-index="${currentSubtitleIndex}"]`)
        if (target) {
          target.scrollIntoView({ inline: 'center', block: 'center' })
        }
      }
    }, [currentSubtitle, isIntersec])

    const observer = useMemo(
      () =>
        new IntersectionObserver(entry => {
          if (entry[0]) {
            const isIntersecting = entry[0].isIntersecting
            setIntersec(isIntersecting)
          }
        }),
      []
    )

    useEffect(() => {
      const container = containerRef.current
      if (container) {
        const target = container.querySelector(`[data-subtitle-index="${currentSubtitleIndex}"]`)
        if (target) {
          observer.observe(target)
          return () => {
            observer.unobserve(target)
          }
        }
      }
    }, [currentSubtitle])

    useEffect(() => {
      return () => {
        observer.disconnect()
      }
    }, [])
    const renderContainer = (children: ReactNode) => {
      return (
        <div
          style={{
            gridColumn: 2,
            height: '100vh',
            ...style
          }}
          className={'relative'}
        >
          <div
            ref={containerRef}
            className={classnames(className, 'reader-subtitle h-full overflow-y-auto flex flex-col font-medium w-full subtitle-common')}
          >
            {children}
          </div>
          {currentSubtitle && (
            <Icon
              size={24}
              onClick={() => {
                const container = containerRef.current
                if (container && currentSubtitleIndex >= 0) {
                  const target = container.querySelector(`[data-subtitle-index="${currentSubtitleIndex}"]`)
                  if (target) {
                    target.scrollIntoView({ inline: 'center', block: 'center' })
                  }
                }
              }}
              name='park-undo'
              className={classnames(
                'absolute transition-all right-0 translate-x-1/2 bottom-1/2 -translate-y-1/2 p-1.5 text-black rounded-full cursor-pointer bg-amber-400',
                isIntersec && 'scale-0 opacity-0'
              )}
            ></Icon>
          )}
        </div>
      )
    }

    if (mode === 'none') {
      return renderContainer(<Icon size={48} name='custom-CCDisabled' className='text-red-500 opacity-80 pt-32 m-auto' />)
    }
    if (!highlighted?.length) {
      return renderContainer(<EmptyList className='pt-32'></EmptyList>)
    }
    return renderContainer(
      <>
        {renderPopover()}
        {highlighted?.map((i, idx) => (
          <Item
            isCurrent={currentSubtitleIndex === idx}
            isPast={currentSubtitleIndex > idx}
            index={idx}
            {...i}
            text={mode === 'both' || mode === 'original' ? i.text : ''}
            translation={mode === 'both' || mode === 'translated' ? i.translation : ''}
            className={subtitleClassName}
            key={idx}
          />
        ))}
      </>
    )
  }
)

const Item = ({
  className,
  style,
  text,
  translation,
  index,
  isPast,
  start,
  isCurrent
}: IMediaSubtitle & { className?: string; style?: CSSProperties; index: number; isPast: boolean; isCurrent: boolean }) => {
  const { ref, isIn } = useIsIn()
  const instance = useMediaInstance()
  return (
    <div ref={ref} data-subtitle-index={index} className={className}>
      {isIn && (
        <Icon
          name={'park-play-one'}
          style={{
            border: '1.5px solid white',
            padding: 2
          }}
          onClick={() => {
            instance.actionOps?.jumpTo(start)
          }}
          size={11}
          strokeWidth={4}
          theme={'filled'}
          className={'absolute text-white opacity-60 cursor-pointer hover:opacity-100 transition-opacity top-1 rounded-full left-3'}
        />
      )}
      {text && (
        <div
          style={{
            color: isCurrent ? 'rgb(255,200,98)' : isPast ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)'
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        ></div>
      )}
      {translation && (
        <div
          style={{
            fontSize: !text ? '1em' : '0.86em',
            color:
              isCurrent && !text
                ? 'rgb(255,200,98)'
                : isPast
                  ? 'rgba(255, 255, 255, 0.5)'
                  : !text
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.7)'
          }}
          data-nonselect
          className={classnames('font-normal select-none', text && 'mt-2 mb-2')}
        >
          {translation}
        </div>
      )}
    </div>
  )
}
