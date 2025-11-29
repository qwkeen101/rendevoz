import { memo, useEffect, useRef, useState } from 'react'
import { MetaStore } from '@/api/stores'
import { Colors } from '@/consts'
import { getScheduling, ReviewStateType } from '@/core/review/fsrs'
import { Content } from '@/components'
import { DateFormat } from '@/utils'
import { useTranslation } from 'react-i18next'
import '../flip.less'
import ReviewContentFront from '@/core/components/review/viewer/ReviewContentFront'
import { IReviewCard, IReviewStateType } from '~/typings'
import useReviewState, { useSetReviewState } from '@/core/components/review/useReviewState'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import isHotkey from 'is-hotkey'
import toast from 'react-hot-toast'
import SidebarObjectViewer from '@/core/components/SidebarObjectViewer'

export default memo(
  ({
    metaId,
    progress,
    onReview,
    card,
    onNavigate,
    canNavigate,
    reviewed
  }: {
    metaId?: number
    onReview: (type: IReviewStateType | 'skip', timeUsed?: number) => void
    card: IReviewCard
    onNavigate: (direction: 'next' | 'prev') => void
    progress: {
      current: number
      total: number
    }
    canNavigate: {
      prev: boolean
      next: boolean
    }
    reviewed?: IReviewStateType
  }) => {
    const { t } = useTranslation()
    const [startTime, setStartTime] = useState<number>()
    const reviewOptions = [
      {
        type: 'skip',
        text: t(ReviewConsts.trans.skip),
        bg: ReviewConsts.colors.skip
      },
      {
        type: 'again',
        text: t(ReviewConsts.trans.again),
        bg: ReviewConsts.colors.again
      },
      {
        type: 'hard',
        text: t(ReviewConsts.trans.hard),
        bg: ReviewConsts.colors.hard
      },
      {
        type: 'good',
        text: t(ReviewConsts.trans.good),
        bg: ReviewConsts.colors.good
      },
      {
        type: 'easy',
        text: t(ReviewConsts.trans.easy),
        bg: ReviewConsts.colors.easy
      }
    ]
    const currMeta = MetaStore.useValue(metaId)
    const [dues, setDues] = useState<Record<IReviewStateType, Date>>({})
    const reviewState = useReviewState()
    const setReviewState = useSetReviewState()
    const flipped = reviewState.flipped
    const preventedByShortcut = useRef(false)
    const handleReview = async (type: ReviewStateType, toaster?: boolean) => {
      if (preventedByShortcut.current) return
      if (toaster && type !== 'skip') {
        preventedByShortcut.current = true
        const timeUsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined
        setTimeout(() => {
          preventedByShortcut.current = false
          setReviewState(s => ({ ...s, flipped: false }))
          onReview(type, timeUsed)
        }, 650)
        toast.custom(
          <div className={'items-center flex gap-2'}>
            <span className={'text-xl'}>{ReviewConsts.emojis[type]}</span>
            {`${t(ReviewConsts.trans[type])}`}
          </div>,
          {
            duration: 500
          }
        )
        return
      } else {
        setReviewState(s => ({ ...s, flipped: false }))
        const timeUsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined
        onReview(type, timeUsed)
      }
    }
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
      setDues(getScheduling(card))
      setStartTime(Date.now())
    }, [card])

    useEffect(() => {
      const kH = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLElement && e.target.closest('input,textarea,[contenteditable="true"]')) return
        const pos = mousePos.current
        const container = containerRef.current
        if (container) {
          const ele = document.elementFromPoint(pos[0], pos[1])
          if (container.contains(ele)) {
            if (isHotkey('g', e)) {
              handleReview('good', true)
            }
            if (isHotkey('e', e)) {
              handleReview('easy', true)
            }
            if (isHotkey('h', e)) {
              handleReview('hard', true)
            }
            if (isHotkey('a', e)) {
              handleReview('again', true)
            }
          }
        }
      }
      document.addEventListener('keydown', kH)
      return () => {
        document.removeEventListener('keydown', kH)
      }
    })
    useEffect(() => {
      return () => setReviewState(s => ({ ...s, flipped: false }))
    }, [])

    if (!currMeta) {
      return null
    }
    const m = MetaStore.getCachedMetaObject(metaId)
    const renderOptions = () => {
      return (
        <Content className={'border-top'} flex justifyContent={'center'} style={{ padding: '16px', flexShrink: 0 }} gap={12}>
          {reviewOptions.map(i => (
            <div
              key={i.text}
              className={'rounded-lg'}
              style={{
                flex: 1,
                background: Colors.getAdaptColor(i.bg),
                color: Colors.getAdaptFontColor(i.bg)
              }}
              onClick={() => {
                handleReview(i.type)
              }}
            >
              <div className={'button !transition-colors justify-center w-full h-full !p-2 rounded-lg flex flex-col gap-1 items-center'}>
                <div className={'font-bold text-lg'}>{i.text}</div>
                {dues?.[i.type] && (
                  <div className={'font-size-12'}>
                    {t('review.Review in', { days: DateFormat.formatDistanceToNowStrict(dues?.[i.type]) })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Content>
      )
    }
    if (!m) return null
    return (
      <div ref={containerRef} className={'w-full h-full relative'}>
        <ReviewContentFront
          onReview={handleReview}
          id={m.id}
          reviewed={reviewed}
          progress={progress}
          onClick={() => setReviewState(s => ({ ...s, flipped: true }))}
          visible={!flipped}
          onNavigate={onNavigate}
          canNavigate={canNavigate}
        />
        {flipped && (
          <div className={'w-full h-full flex flex-col relative overflow-hidden back-card'}>
            <div
              className={'w-full items-center flex flex-1'}
              style={{
                width: '100%',
                position: 'relative',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              <SidebarObjectViewer id={m.id} key={m.id} />
            </div>
            {renderOptions()}
          </div>
        )}
      </div>
    )
  }
)
