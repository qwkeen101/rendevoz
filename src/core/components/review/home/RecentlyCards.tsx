import useReviewState from '@/core/components/review/useReviewState'
import { IReviewCard } from '~/typings'
import { MetaStore } from '@/api/stores'
import { DateFormat } from '@/utils'
import { CheckBox, Icon, WithBorder } from '@/components'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import ContextMenu from '@/components/contextMenu'
import { ObjectActionMenu } from '@/core'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import { RefObject } from 'react'
import NoResult from '@/core/components/common/NoResult'

const getTime = (d: Date | number) => {
  if (typeof d === 'number') return d
  return d.getTime()
}
export default ({
  scrollElementRef,
  max,
  className
}: {
  scrollElementRef?: RefObject<HTMLDivElement>
  max?: number
  className?: string
}) => {
  const { t } = useTranslation()
  const reviewState = useReviewState()
  const recently = reviewState.recently.slice(0, max ?? reviewState.recently.length)
  if (!recently.length) return <NoResult />
  return (
    <div className={'-mx-2'}>
      <div className={'flex gap-5 w-full font-size-12 transparent-font pl-2 mb-1'}>
        <div
          style={{
            width: 180
          }}
        >
          {t('review.Date')}
        </div>
        <div
          style={{
            width: 120
          }}
        >
          {t('review.Rating')}
        </div>
        <div
          style={{
            width: 120
          }}
        >
          {t('general.type')}
        </div>
        <div
          style={{
            flex: 1
          }}
        >
          {t(trans.Name)}
        </div>
      </div>
      {scrollElementRef ? (
        <VirtualLoader
          scrollElementRef={scrollElementRef}
          count={recently.length}
          size={36}
          overscan={3}
          renderItem={idx => {
            const i = recently[idx]
            if (i) {
              return <ReviewHistoryItem card={i.card} metaId={i.metaId} key={i.card.id}></ReviewHistoryItem>
            }
            return null
          }}
        ></VirtualLoader>
      ) : (
        recently.map(i => <ReviewHistoryItem thirdTag card={i.card} metaId={i.metaId} key={i.card.id}></ReviewHistoryItem>)
      )}
    </div>
  )
}
const CustomCalendar = () => (
  <svg width="1em" height="1em" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 19H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V19Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M5 9C5 7.89543 5.89543 7 7 7H41C42.1046 7 43 7.89543 43 9V19H5V9Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M16 4V12" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M32 4V12" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
  </svg>
)
export const ReviewHistoryItem = ({
  card,
  metaId,
  showDate = true,
  thirdTag,
  date = 'last_review',
  hideDate = false,
  onSelect,
  selected
}: {
  card: IReviewCard
  metaId: number
  showDate?: boolean
  thirdTag?: boolean
  date?: 'due' | 'last_review'
  hideDate?: boolean
  onSelect?: VoidFunction
  selected?: boolean
}) => {
  const m = MetaStore.useValue(metaId)
  const { t } = useTranslation()
  if (m && !m.deleted) {
    const name = Global.metaOps.getMetaName(m)
    let time = card[date] ? getTime(card[date]) : undefined
    if (date === 'due' && time && time < Date.now()) {
      time = Date.now()
    }
    return (
      <ContextMenu
        content={setV => (
          <WithBorder>
            <ObjectActionMenu metaObjectId={metaId} onClose={() => setV(false)} />
          </WithBorder>
        )}
      >
        <div
          onClick={() => {
            if (onSelect) {
              onSelect()
              return
            }
            Global.layoutOps?.openObject(metaId)
          }}
          className={'flex gap-5 button !py-2 items-center'}
        >
          {onSelect && (
            <>
              <CheckBox checked={selected} />
            </>
          )}
          {hideDate ? null : (
            <div
              style={{
                width: showDate ? 180 : 100
              }}
              className={'flex gap-3 items-center'}
            >
              {time ? (
                <>
                  {showDate && (
                    <div className={'flex items-center font-size-12 gap-2'}>
                      <CustomCalendar />
                      {DateFormat.format(time, 'y.M.dd')}
                    </div>
                  )}
                  <div className={'flex items-center font-size-12 gap-2'}>
                    <Icon name={'park-time'} />
                    {DateFormat.format(time, 'HH:mm')}
                  </div>
                </>
              ) : (
                <div className={'super-transparent-font'}>{t('review.No date')}</div>
              )}
            </div>
          )}
          <div
            style={{
              width: 120
            }}
            className={classnames('flex gap-2 items-center', !card.last_rate && 'super-transparent-font')}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: card.last_rate ? ReviewConsts.colors[card.last_rate] : 'var(--font-s-transparent)'
              }}
            ></div>
            {t(card.last_rate ? ReviewConsts.trans[card.last_rate] : 'review.No rating')}
          </div>
          <div
            style={{
              width: 120
            }}
          >
            <div className={classnames('object-name-item font-size-12 w-fit', thirdTag && 'bg-third-important')}>
              {Global.utils.getTypeName(m.type)}
            </div>
          </div>
          <div className={'flex gap-3 flex-1'}>
            {m.coverImgSrc ? <img src={m.coverImgSrc} className={'size-6 shrink-0 rounded-full object-cover'} /> : null}
            <div className={classnames('line-clamp-1 break-all', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
          </div>
        </div>
      </ContextMenu>
    )
  }
}
