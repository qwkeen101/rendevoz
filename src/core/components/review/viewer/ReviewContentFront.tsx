import { MetaStore, ObjectStore } from '@/api/stores'
import { AnimatePopover, Button, ContentEditor, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { Icons, KEY } from '@/consts'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { DateFormat } from '@/utils'
import ReviewStore from '@/api/stores/review.store'
import classnames from 'classnames'
import ScheduledCards from '@/core/components/review/viewer/ReviewCardList'
import { AnimatePresence, motion } from 'framer-motion'
import useReviewInstance from '@/core/components/review/useReviewInstance'
import isHotkey from 'is-hotkey'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import { Lethargy } from 'lethargy-ts'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import ToolTip from '@/components/base/Tooltip'
import { useNorepeatNavigate } from '@/hooks'
import { IReviewCard, IReviewStateType } from '~/typings'
import produce from 'immer'

const lethargy = new Lethargy({
  sensitivity: 1
})
export default ({
  id,
  onNavigate,
  reviewed,
  visible,
  progress,
  onClick,
  canNavigate,
  onReview
}: {
  id: number
  progress: {
    current: number
    total: number
  }
  canNavigate: {
    prev: boolean
    next: boolean
  }
  onReview?: (type: IReviewStateType) => void
  onClick: VoidFunction
  visible: boolean
  reviewed?: IReviewStateType
  onNavigate: (direction: 'next' | 'prev') => void
}) => {
  const meta = MetaStore.useValue(id)
  const card = ObjectStore('reviewCard').useValue(meta?.review)
  const { t } = useTranslation()
  const instance = useReviewInstance()
  const [commentVisible, setCommentVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wheelDelta = useRef({
    x: 0,
    y: 0
  })
  const navigate = useNorepeatNavigate()
  const wheeled = useRef(false)
  useEffect(() => {
    const kH = (e: KeyboardEvent) => {
      const pos = mousePos.current
      const container = containerRef.current
      if (container) {
        const ele = document.elementFromPoint(pos[0], pos[1])
        if (container.contains(ele)) {
          if (e.target instanceof HTMLElement && e.target.closest('input,textarea,[contenteditable="true"]')) return
          if (isHotkey([KEY.ArrowRight, KEY.ArrowDown, KEY.Space], e)) {
            onNavigate('next')
          }
          if (isHotkey([KEY.ArrowLeft, KEY.ArrowUp], e)) {
            onNavigate('prev')
          }
          if (isHotkey(KEY.Enter, e)) {
            onClick?.()
          }
          if (isHotkey('i', e)) {
            instance.ignoreScheduledCard?.(id)
          }
        }
      }
    }
    document.addEventListener('keydown', kH)
    return () => {
      document.removeEventListener('keydown', kH)
    }
  })
  const renderComments = () => {
    if (card?.comments?.length || commentVisible) {
      return (
        <div onClick={e => e.stopPropagation()} className={'flex cursor-auto flex-col px-4 w-[700px] max-w-full border-top pt-6 gap-3'}>
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
                ReviewStore.updateCard(id, c => ({
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
          {card?.comments?.map((i, idx) => (
            <ReviewComment
              onDelete={() => {
                if (card) {
                  ObjectStore('reviewCard').updateOne({ id: card.id, comments: card.comments?.filter(o => o.createdAt !== i.createdAt) })
                }
              }}
              files={i.files}
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
              key={i.createdAt}
              createdAt={i.createdAt}
              content={i.content}
            />
          ))}
        </div>
      )
    }
  }
  const name = (meta?.type.includes('Label') ? meta?.placeholderName : meta?.name) || t(trans.Unnamed)
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={containerRef}
          initial={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onWheelCapture={e => {
            if (!e.currentTarget.contains(e.target)) return
            if (lethargy.check(e)) {
              if (wheeled.current) {
                return
              }
              wheelDelta.current.x += e.deltaX
              wheelDelta.current.y += e.deltaY
              if (wheelDelta.current.x > 150) {
                onNavigate('next')
                wheeled.current = true
                wheelDelta.current = {
                  x: 0,
                  y: 0
                }
              }
              if (wheelDelta.current.x < -150) {
                onNavigate('prev')
                wheeled.current = true
                wheelDelta.current = {
                  x: 0,
                  y: 0
                }
              }
              if (wheeled.current) {
                setTimeout(() => {
                  wheeled.current = false
                }, 300)
              }
            }
          }}
          className={'flex flex-col w-full h-full front-card z-[10000] bg-global'}
          onClick={() => {
            if (commentVisible) {
              setCommentVisible(false)
              return
            }
            onClick()
          }}
        >
          <Icon
            onClick={e => {
              navigate('/dashboard')
              e.stopPropagation()
            }}
            strokeWidth={4}
            size={18}
            name={'park-close'}
            className={'z-[20000] !p-2 transparent-font !absolute top-3 right-3 square-button'}
          />
          <div className={'overflow-hidden flex-1 cursor-pointer relative'}>
            <AnimatePresence>
              <motion.div
                key={id}
                exit={{
                  opacity: 0,
                  zIndex: 100,
                  position: 'absolute'
                }}
                className={'overflow-y-auto bg-global h-full w-full'}
              >
                <div className={'flex flex-col p-14 w-full min-h-full items-center justify-center gap-8'}>
                  {meta?.coverImgSrc && <img className={'min-w-[26rem] max-w-2xl rounded-2xl object-cover'} src={meta.coverImgSrc} />}
                  <div
                    className={classnames(
                      'whitespace-pre-wrap max-w-[80%] leading-relaxed font-bold text-center',
                      name.length > 500 ? 'text-xl' : name.length > 300 ? 'text-2xl' : 'text-3xl',
                      name === t(trans.Unnamed) && 'super-transparent-font'
                    )}
                  >
                    {name}
                  </div>
                  {renderComments()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className={'relative w-full shrink-0'}>
            <div className={'flex p-4 items-center justify-between'}>
              <Icon
                onClick={e => {
                  e.stopPropagation()
                  canNavigate.prev && onNavigate('prev')
                }}
                name={'park-arrow-left'}
                size={20}
                className={classnames('square-button', !canNavigate.prev && '!cursor-not-allowed opacity-40')}
              />
              <div className={'flex items-center gap-2 transparent-font'}>
                <AnimatePopover
                  withClickCover
                  padding={6}
                  positions={['top']}
                  content={setV => (
                    <WithBorder onClick={e => e.stopPropagation()}>
                      <ScheduledCards onClose={() => setV(false)} current={progress.current} />
                    </WithBorder>
                  )}
                >
                  <Button.IconButton
                    onClick={e => e.stopPropagation()}
                    icon={'custom-review-card'}
                    size={18}
                    text={`${progress.current + 1} / ${progress.total}`}
                  ></Button.IconButton>
                </AnimatePopover>
                <div className={'border-right h-8'}></div>
                <AnimatePopover
                  positions={['top']}
                  padding={6}
                  withClickCover
                  content={setV => (
                    <WithBorder onClick={e => e.stopPropagation()} className={'popover-menu'}>
                      <Menu.NavigationMenu
                        layout={[
                          [`${ReviewConsts.emojis.easy} ${t(ReviewConsts.trans.easy)}`, 'easy'],
                          [`${ReviewConsts.emojis.good} ${t(ReviewConsts.trans.good)}`, 'good'],
                          [`${ReviewConsts.emojis.hard} ${t(ReviewConsts.trans.hard)}`, 'hard'],
                          [`${ReviewConsts.emojis.again} ${t(ReviewConsts.trans.again)}`, 'again']
                        ].map(i => ({
                          type: 'item',
                          key: i[0],
                          text: i[0],
                          onSelect: () => {
                            onReview?.(i[1])
                            setV(false)
                          }
                        }))}
                      />
                    </WithBorder>
                  )}
                >
                  <div>
                    {reviewed ? (
                      <div onClick={e => e.stopPropagation()} className={'button flex items-center'}>
                        <span className={'mr-1.5 text-xl leading-none'}>{ReviewConsts.emojis[reviewed]}</span>
                        {t(ReviewConsts.trans[reviewed])}
                      </div>
                    ) : (
                      <Button.IconButton
                        onClick={e => e.stopPropagation()}
                        text={t('review.Give a rating')}
                        icon={'park-star'}
                      ></Button.IconButton>
                    )}
                  </div>
                </AnimatePopover>
                <Button.IconButton
                  icon={'park-quote'}
                  onClick={e => {
                    e.stopPropagation()
                    setTimeout(() => setCommentVisible(!commentVisible))
                  }}
                  text={t('review.Add a comment')}
                  className={'!rounded-lg'}
                />
                <Button.IconButton
                  icon={'park-forbid'}
                  onClick={e => {
                    e.stopPropagation()
                    instance.ignoreScheduledCard?.(id)
                  }}
                  text={t('review.Ignore card')}
                  className={'!rounded-lg'}
                />
                <Button.IconButton
                  onClick={e => {
                    e.stopPropagation()
                    Global.metaOps.openDetails(id)
                  }}
                  icon={Icons.Info}
                  text={t(trans.Meta.ViewDetails)}
                  className={'!rounded-lg'}
                />
                <ToolTip
                  disableDefaultContent
                  content={
                    <WithBorder className={'p-4 w-80'}>
                      <div className={'font-semibold text-lg mb-1'}>{t('review.Shortcuts')}</div>
                      {[
                        [t('review.Navigate to previous card'), '←'],
                        [t('review.Navigate to next card'), '→'],
                        [t('review.Flip card'), '↵'],
                        [t('review.Skip card'), 'Space'],
                        [t('review.Ignore card'), 'I'],
                        [`${ReviewConsts.emojis.easy} ${t(ReviewConsts.trans.easy)}`, 'E'],
                        [`${ReviewConsts.emojis.good} ${t(ReviewConsts.trans.good)}`, 'G'],
                        [`${ReviewConsts.emojis.hard} ${t(ReviewConsts.trans.hard)}`, 'H'],
                        [`${ReviewConsts.emojis.again} ${t(ReviewConsts.trans.again)}`, 'A']
                      ].map((i, idx, arr) => (
                        <div
                          key={i[1]}
                          className={classnames(
                            'flex justify-between',
                            idx !== arr.length - 1 ? 'py-1.5' : 'pt-1.5',
                            i[1] === 'E' && 'border-top mt-1 !pt-2.5'
                          )}
                        >
                          <div>{i[0]}</div>
                          <div className={'bg-third transparent-font px-2 font-size-13 leading-none flex items-center rounded-md'}>
                            {i[1]}
                          </div>
                        </div>
                      ))}
                    </WithBorder>
                  }
                >
                  <Icon
                    onClick={e => {
                      e.stopPropagation()
                    }}
                    size={16}
                    className={'square-button !p-2'}
                    name={'park-command'}
                  />
                </ToolTip>
              </div>
              <Icon
                name={'park-arrow-right'}
                onClick={e => {
                  e.stopPropagation()
                  canNavigate.next && onNavigate('next')
                }}
                size={20}
                className={classnames('square-button', !canNavigate.next && '!cursor-not-allowed opacity-40')}
              />
            </div>
            <div
              className={'absolute bottom-0 left-0 h-1 select-color-bg opacity-70'}
              style={{
                width: `${(progress.current / progress.total) * 100}%`
              }}
            ></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const ReviewComment = ({
  files,
  createdAt,
  content,
  onChange,
  onDelete
}: Required<IReviewCard>['comments'][0] & {
  onChange?: (v: string) => void
  onDelete: VoidFunction
}) => {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  if (isEditing) {
    return (
      <ContentEditor
        className={'!p-0 !rounded-none !shadow-none'}
        placeholder={'Add a comment...'}
        style={{
          fontSize: '1rem',
          width: '100%'
        }}
        value={content}
        onChange={v => {
          onChange?.(v)
          setIsEditing(false)
        }}
      />
    )
  }
  return (
    <div>
      <div className={'flex justify-between'}>
        <div className={'transparent-font font-size-11'}>{DateFormat.formatTime(createdAt)}</div>
        <IconWithPopover
          size={18}
          placement={['bottom', 'top']}
          padding={6}
          content={
            <WithBorder className={'popover-menu-small'}>
              <Menu.NavigationMenu
                layout={[
                  {
                    type: 'item',
                    text: t(trans.Edit),
                    key: 'edit',
                    icon: Icons.Edit,
                    onSelect: () => setIsEditing(true)
                  },
                  {
                    type: 'item',
                    text: t(trans.Delete),
                    key: 'delete',
                    icon: Icons.Delete,
                    onSelect: onDelete
                  }
                ]}
              />
            </WithBorder>
          }
          name={Icons.More}
          className={'hover-active-button'}
        />
      </div>
      {content}
    </div>
  )
}
