import { memo, useEffect, useState } from 'react'
import { AnimatePopover, Button, Icon, Menu, Modal, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import CategorizedCards from '@/core/components/review/home/CategorizedCards'
import useReviewState from '@/core/components/review/useReviewState'
import RecentlyCards from '@/core/components/review/home/RecentlyCards'
import { useNorepeatNavigate } from '@/hooks'
import ReviewStatistics from '@/core/components/review/home/ReviewStatistics'
import TodayTarget from '@/core/components/review/home/TodayTarget'
import useReviewInstance from '@/core/components/review/useReviewInstance'
import trans from '@/consts/trans'
import FutureCards from '@/core/components/review/home/FutureCards'
import { Icons } from '@/consts'
import useMoveToFlashcardFolder from '@/core/components/review/useMoveToFlashcardFolder'

function getTimeOfDayEnglish() {
  const now = new Date()
  const hours = now.getHours()

  if (hours >= 5 && hours < 12) {
    return 'morning'
  } else if (hours >= 12 && hours < 18) {
    return 'afternoon'
  } else {
    return 'evening'
  }
}
export default memo(() => {
  const { t } = useTranslation()
  const instance = useReviewInstance()
  const navigate = useNorepeatNavigate()
  const state = useReviewState()
  const time = getTimeOfDayEnglish()
  const unlearned = state.todayTarget.total - state.todayTarget.finished
  useEffect(() => {
    instance.index?.(false)
  }, [])
  const folderMenu = useMoveToFlashcardFolder(state.groupId)
  return (
    <div className={'w-full h-full overflow-y-auto p-6'}>
      <div className={'mx-auto max-w-5xl w-full flex flex-col pb-20 gap-7 @container'}>
        <div className={'items-center mt-5 flex'}>
          <div className={'mr-auto'}>
            <div className={'text-4xl primary-font flex items-end font-bold mb-2'}>
              {t(`review.Good ${time}`)},
              <div className={'text-lg ml-2 leading-none'}>
                {state.todayTarget.total ? (
                  unlearned ? (
                    <div dangerouslySetInnerHTML={{ __html: t('review.Cards to study', { num: unlearned }) }}></div>
                  ) : (
                    <div>{t('review.All cards studied')} 🎉</div>
                  )
                ) : (
                  <div>{t('review.welcome to flashcard study')}</div>
                )}
              </div>
            </div>
          </div>
          {state.groupId && (
            <AnimatePopover
              padding={6}
              positions={['bottom', 'top']}
              content={setV => (
                <WithBorder className={'py-1 min-w-56'}>
                  <Menu.NavigationMenu layout={folderMenu(() => setV(false))} />
                </WithBorder>
              )}
            >
              <Button.IconButton
                size={18}
                icon={Icons.Folder}
                className={'!px-4 border !rounded-3xl !py-1.5 !h-auto'}
                text={t(trans.Save)}
              />
            </AnimatePopover>
          )}
          {state.scheduledCards.length && !state.scheduledCards.every(i => i.reviewed) ? (
            <Button.IconButton
              onClick={() => {
                navigate('/viewer')
              }}
              size={18}
              className={'reverse-theme-button !font-normal !rounded-3xl !px-4 !py-1.5 !h-auto ml-4'}
              text={t('review.Practice now')}
            />
          ) : null}
        </div>
        <div className={'flex gap-7'}>
          <TodayTarget />
          <div className={'flex-1 bg-secondary p-6 rounded-2xl'}>
            <div
              onClick={() => {
                navigate('/cards')
              }}
              className={'flex menu-sub-title items-center gap-1 mb-6 cursor-pointer group w-fit'}
            >
              <div className={'flex gap-2 items-center'}>
                <Icon size={15} name={Icons.ApplicationAll} />
                {t('review.Cards overview')}
              </div>
              <Icon name={'park-right'} className={'transition-transform group-hover:translate-x-1'} />
            </div>
            <CategorizedCards />
          </div>
        </div>
        <ReviewStatistics />
        <div className={'flex flex-col min-h-96 p-6 rounded-2xl bg-secondary'}>
          <div
            onClick={() => {
              navigate('/future')
            }}
            className={'flex menu-sub-title items-center gap-1 mb-4 cursor-pointer group w-fit'}
          >
            <div className={'flex gap-2 items-center'}>
              <Icon name={'custom-review-card'} size={15} />
              {t('review.Future cards')}
            </div>
            <Icon name={'park-right'} className={'transition-transform group-hover:translate-x-1'} />
          </div>
          <FutureCards />
        </div>
        <div className={'flex flex-col min-h-96 rounded-2xl bg-secondary p-6'}>
          <div
            onClick={() => {
              navigate('/history')
            }}
            className={'flex menu-sub-title items-center gap-1 mb-4 cursor-pointer group w-fit'}
          >
            <div className={'flex gap-2 items-center'}>
              <Icon name={Icons.History} size={15} />
              {t('review.Recently studied')}
            </div>
            <Icon name={'park-right'} className={'transition-transform group-hover:translate-x-1'} />
          </div>
          <RecentlyCards max={10} />
        </div>
      </div>
    </div>
  )
})
