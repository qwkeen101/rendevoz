import { ObjectStore } from '@/api/stores'
import { IReviewCard, IReviewDue, IReviewStateType } from '~/typings'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import trans from '@/consts/trans'
import { DateFormat } from '@/utils'
import { ContentEditor, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { Icons } from '@/consts'
import ReviewStore from '@/api/stores/review.store'
import classnames from 'classnames'
import { ReviewComment } from '@/core/components/review/viewer/ReviewContentFront'
import produce from 'immer'

const RatingToRate: Record<number, IReviewStateType> = {
  1: 'again',
  2: 'hard',
  3: 'good',
  4: 'easy'
}
const StateToDue: Record<number, IReviewDue> = {
  0: 'new',
  1: 'learning',
  2: 'review',
  3: 'relearning'
}
export default memo((card: IReviewCard & { metaId: number }) => {
  const { t } = useTranslation()
  const [commentVisible, setCommentVisible] = useState(false)
  const due = Math.max(new Date(card.due || Date.now()).getTime(), Date.now())
  return (
    <>
      <div className={'flex gap-5 items-center absolute top-3 right-0'}>
        <IconWithPopover
          placement={['bottom', 'top']}
          content={setV => (
            <WithBorder className={'popover-menu-mid'}>
              <Menu.NavigationMenu
                layout={[
                  {
                    type: 'title',
                    name: t('review.Mark as'),
                    key: '1'
                  },
                  ...['easy', 'good', 'hard', 'again'].map(i => ({
                    type: 'item',
                    key: i,
                    onSelect: () => {
                      setV(false)
                      ReviewStore.reviewCard(card.metaId, i)
                    },
                    text: `${ReviewConsts.emojis[i]}\xa0\xa0${t(ReviewConsts.trans[i])}`
                  }))
                ]}
              />
            </WithBorder>
          )}
          name={'park-check'}
          className={'hover-active-button'}
          size={20}
          tooltip={t('review.Mark as')}
        />
        <Icon
          tooltip={t('review.Add a comment')}
          size={20}
          className={'hover-active-button'}
          onClick={() => setCommentVisible(!commentVisible)}
          name={'park-quote'}
        />
        <IconWithPopover
          placement={['bottom', 'top']}
          content={setV => (
            <WithBorder className={'popover-menu-mid'}>
              <Menu.NavigationMenu
                layout={[
                  {
                    type: 'item',
                    text: t('review.Reset study progress'),
                    key: 'reset',
                    icon: 'park-undo',
                    onSelect: () => {
                      setV(false)
                      ReviewStore.resetProgress(card.metaId)
                    }
                  },
                  {
                    type: 'item',
                    text: t(trans.Delete),
                    key: 'delete',
                    icon: Icons.Delete,
                    onSelect: () => {
                      ObjectStore('reviewCard').deleteOneById(card.id)
                    }
                  }
                ]}
              />
            </WithBorder>
          )}
          name={Icons.More}
          className={'hover-active-button'}
          size={22}
        />
      </div>
      <div>
        <div className={'font-size-12 select-none transparent-font mb-2'}>{t('review.Status')}</div>
        {card.state ? (
          <div className={'flex items-center gap-2'}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: ReviewConsts.colors[StateToDue[card.state]]
              }}
            ></div>
            <div>{t(ReviewConsts.trans[StateToDue[card.state]])}</div>
          </div>
        ) : (
          <span className={'super-transparent-font'}>{t('general.No result')}</span>
        )}
      </div>
      <div>
        <div className={'font-size-12 select-none transparent-font mb-2'}>{t('review.Next study time')}</div>
        {DateFormat.format(due, DateFormat.Formats.yearMonthDays)} {DateFormat.format(due, DateFormat.Formats.minute)}
      </div>
      {card.comments?.length || commentVisible ? (
        <div>
          <div className={'font-size-12 select-none transparent-font mb-2'}>{t('review.Comments')}</div>
          {commentVisible && (
            <ContentEditor
              className={'!p-0 !rounded-none mb-2 !shadow-none'}
              placeholder={`${t('review.Add a comment')}...`}
              style={{
                fontSize: '1rem',
                width: '100%'
              }}
              onChange={v => {
                setCommentVisible(false)
                ReviewStore.updateCard(card.metaId, c => ({
                  ...c,
                  comments: [
                    {
                      content: v,
                      createdAt: Date.now()
                    },
                    ...(c.comments || [])
                  ]
                }))
              }}
            />
          )}
          <div className={'flex flex-col gap-2'}>
            {card.comments?.map((i, idx) => (
              <ReviewComment
                key={i.createdAt}
                {...i}
                onChange={v => {
                  if (card) {
                    ObjectStore('reviewCard').updateOne({
                      id: card.id,
                      comments: produce(card.comments!, draft => {
                        draft[idx].content = v
                      })
                    })
                  }
                }}
                onDelete={() => {
                  ObjectStore('reviewCard').updateOne({ id: card.id, comments: card.comments?.filter(o => o.createdAt !== i.createdAt) })
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <div className={'font-size-12 select-none transparent-font mb-2'}>{t(trans.History)}</div>
        {card.logs?.length ? (
          card.logs
            ?.slice()
            ?.reverse()
            ?.map((i, idx, arr) => (
              <div className={'flex gap-2'}>
                <div className={'flex flex-col items-center'}>
                  <div className={'text-xl leading-none'}>{ReviewConsts.emojis[RatingToRate[i.rating]]}</div>
                  <div className={'border-right !border-dotted h-full'}></div>
                </div>
                <div className={classnames('mt-1', idx === arr.length - 1 ? undefined : 'pb-3')}>
                  <div className={'font-size-11 leading-none transparent-font mb-1.5'}>
                    {DateFormat.formatTime(i.review)}
                  </div>
                  <div className={'flex items-center font-size-13'}>
                    <span className={'transparent-font mr-1'}>{t('review.Rating')}:</span> {t(ReviewConsts.trans[RatingToRate[i.rating]])}
                    <span className={'transparent-font ml-3 mr-1'}>{t('review.Status')}:</span>
                    <span>
                      {t(ReviewConsts.trans[StateToDue[i.state]])}
                      {arr[idx - 1]?.state || card.state
                        ? ` → ${t(ReviewConsts.trans[StateToDue[(arr[idx - 1]?.state || card.state)!]])}`
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className={'super-transparent-font'}>{t('general.No result')}</div>
        )}
      </div>
    </>
  )
})
