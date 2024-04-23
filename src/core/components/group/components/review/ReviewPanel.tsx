import { Button, Content, Icon, IconWithPopover, Modal, ResizeAndDrag, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { memo, useEffect, useState } from 'react'
import { css } from '@emotion/css'
import { ClassName } from 'rendevoz'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { assignProperties, DateFormat } from '@/utils'
import { MetaStore, ObjectStore } from '@/api/stores'
import { State } from 'fsrs.js'
import ReviewContent from '@/core/components/group/components/review/ReviewContent'
import ReviewCongradulation from '@/core/components/group/components/review/ReviewCongradulation'
import { GlobalInstance, useMemoizedFn } from '@/hooks'
import NeedReview from '@/core/components/group/components/review/NeedReview'
import { useTranslation } from 'react-i18next'
import { upperFirst } from 'lodash'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { Resizable } from 're-resizable'
import { createPortal } from 'react-dom'

export default memo(() => {
  const instance = useGroupInstance()
  const [panelState, setPanelState] = useState<{
    visible: boolean
    currentMetaId?: number
    rowId?: number
    // due: only study in due cards, relearning: learning before due cards
    mode: 'main' | 'due' | 'relearning'
  }>({
    visible: false,
    mode: 'main'
  })
  const { t } = useTranslation()
  const [dueState, setDueState] = useState<{
    ignored: number[]
    inDues: number[]
    new: number[]
    learning: number[]
    review: number[]
    relearning: number[]
    beforeDues: number[]
  }>({
    inDues: [],
    ignored: [],
    new: [],
    review: [],
    relearning: [],
    learning: [],
    beforeDues: []
  })
  const panelSize = KeyvalueStore.useValue('groupReviewPanelSize')
  const currMeta = MetaStore.useValue(panelState.currentMetaId)
  const currCard = ObjectStore('reviewCard').useValue(currMeta?.review || 0)
  const handleReview = async () => {
    const allMetas = dueState.inDues
    const currIdx = (allMetas?.findIndex(i => i === panelState.currentMetaId) || 0) + 1
    const nextId = currIdx === allMetas?.length ? 0 : currIdx
    setPanelState(s => ({ ...s, currentMetaId: allMetas?.[nextId] }))
    if (panelState.mode === 'due') {
      setTimeout(() => {
        handleDue()
      }, 10)
    } else {
      setDueState(s => ({ ...s, inDues: s.inDues.filter(i => i !== currMeta?.id) }))
    }
  }
  assignProperties(instance, {
    reviewOps: {
      open: () => {
        setPanelState(s => ({ ...s, visible: true }))
      }
    }
  })

  const renderMain = () => (
    <div
      style={{
        padding: '16px',
        zIndex: 1000,
        boxShadow: Colors.Background.BoxShadow,
        borderRadius: 8,
        background: Colors.Background.Popover,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)'
      }}
    >
      <Content
        flex
        style={{
          marginBottom: '12px'
        }}
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}
        >
          {t('general.Flashcards')}
        </div>
        <Icon
          className={ClassName.flatButton(4, '4px')}
          name={'park-close'}
          onClick={() => {
            setPanelState(s => ({ ...s, visible: false }))
          }}
        />
      </Content>
      <Content
        className={css({
          '.review_title': {
            color: Colors.Font.Transparent,
            fontSize: 12,
            fontWeight: 'bold',
            marginBottom: 4
          }
        })}
        flex
        gap={24}
      >
        <Content style={{ marginRight: 'auto', paddingRight: 60 }}>
          <div className={'review_title'}>
            <b>{t('general.Total')}</b>
          </div>
          <div>
            <b>{dueState.learning.length + dueState.relearning.length + dueState.review.length + dueState.new.length}</b>{' '}
            {t('general.cards')}
          </div>
        </Content>

        <Content>
          <div className={'review_title'}>{t('general.New card')}</div>
          <div>
            <b>{dueState.new.length}</b> {t('general.cards')}
          </div>
        </Content>
        <Content>
          <div className={'review_title'}>{t('general.Good')}</div>
          <div>
            <b>{dueState.review.length}</b> {t('general.cards')}
          </div>
        </Content>
        <Content>
          <div className={'review_title'}>{t('general.Learning')}</div>
          <div>
            <b>{dueState.learning.length}</b> {t('general.cards')}
          </div>
        </Content>
        <Content>
          <div className={'review_title'}>{t('general.Stale')}</div>
          <div>
            <b>{dueState.relearning.length}</b> {t('general.cards')}
          </div>
        </Content>
      </Content>
      <Content style={{ fontSize: 14, marginTop: 16 }} alignItems={'center'} justifyContent={'space-between'} flex>
        <div className={'transparent-font font-size-14'}>{t('general.Due today', { num: dueState.inDues.length })}</div>
        <Content flex gap={8}>
          {dueState.beforeDues.length > 0 && (
            <Button.IconButton
              onClick={() => setPanelState(s => ({ ...s, mode: 'relearning' }))}
              text={t('general.Relearn')}
              icon={'park-refresh'}
              className={'border-box-shadow'}
            ></Button.IconButton>
          )}
          {dueState.inDues.length > 0 && (
            <Button.IconButton
              onClick={() => setPanelState(s => ({ ...s, mode: 'due' }))}
              text={t('general.Study now')}
              icon={'park-tips'}
              className={ClassName.selectButton()}
            ></Button.IconButton>
          )}
        </Content>
      </Content>
      <NeedReview onChange={v => setPanelState(s => ({ ...s, currentMetaId: v, mode: 'due' }))} inDues={dueState.inDues} list={false} />
    </div>
  )

  const handleDue = useMemoizedFn(async () => {
    const now = new Date()
    const allMetas = instance.valueOps?.getAllMetasInGroup()
    if (allMetas?.length) {
      const ignored: number[] = [],
        inDues: number[] = [],
        newI: number[] = [],
        review: number[] = [],
        relearning: number[] = [],
        learning: number[] = [],
        beforeDues: number[] = []
      await Promise.all(
        allMetas.map(async m => {
          if (m.review === false) {
            ignored.push(m.id)
          }
          // new item
          if (m.review === undefined) {
            if (panelState.mode === 'due' || panelState.mode === 'main') {
              inDues.push(m.id)
            }
            newI.push(m.id)
          }
          if (m.review) {
            const card = await ObjectStore('reviewCard').getOneById(m.review)
            if (!card) {
              inDues.push(m.id)
              newI.push(m.id)
            }
            if (card) {
              if (card.due.getTime() <= now.getTime()) {
                if (panelState.mode === 'due' || panelState.mode === 'main') {
                  inDues.push(m.id)
                }
              } else {
                if (panelState.mode === 'relearning') {
                  inDues.push(m.id)
                }
                beforeDues.push(m.id)
              }
              switch (card.state) {
                case State.Learning:
                  learning.push(m.id)
                  break
                case State.New:
                  newI.push(m.id)
                  break
                case State.Relearning:
                  relearning.push(m.id)
                  break
                case State.Review:
                  review.push(m.id)
                  break
              }
            }
          }
        })
      )
      setDueState({
        inDues,
        ignored,
        review,
        learning,
        relearning,
        beforeDues,
        new: newI
      })
      setPanelState(s => ({ ...s, currentMetaId: s.currentMetaId && inDues.includes(s.currentMetaId) ? s.currentMetaId : inDues[0] }))
    } else {
      setDueState({
        inDues: [],
        ignored: [],
        new: [],
        review: [],
        relearning: [],
        beforeDues: [],
        learning: []
      })
    }
  })

  useEffect(() => {
    if (panelState.visible) {
      handleDue()
    }
  }, [panelState.visible, panelState.mode])

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (currMeta) {
      let idx = dueState.inDues.findIndex(i => i === currMeta.id)
      if (idx >= 0) {
        if (direction === 'prev') {
          idx = idx - 1 < 0 ? dueState.inDues.length - 1 : idx - 1
        } else {
          idx = idx + 1 > dueState.inDues.length - 1 ? 0 : idx + 1
        }
        setPanelState(s => ({ ...s, currentMetaId: dueState.inDues[idx] }))
      }
    }
  }
  const renderReview = () => (
    <ResizeAndDrag
      onResizeStop={(el, direction, elementRef) => {
        KeyvalueStore.updateOne('groupReviewPanelSize', [
          elementRef.clientWidth,
          elementRef.clientHeight,
          elementRef.clientLeft,
          elementRef.clientTop
        ])
      }}
      onDragStop={(e, data) => {
        const n = data.node
        const bounding = n.getBoundingClientRect()
        KeyvalueStore.updateOne('groupReviewPanelSize', [bounding.width, bounding.height, bounding.left, bounding.top])
      }}
      default={{
        width: panelSize?.[0] ?? '60vw',
        height: panelSize?.[1] ?? '80vh',
        x: panelSize?.[2] ?? window.innerWidth * 0.2,
        y: panelSize?.[3] ?? window.innerHeight * 0.1
      }}
      dragHandleClassName={'drag-handle'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: Colors.Background.BoxShadow,
        borderRadius: 8,
        background: Colors.Background.Popover
      }}
    >
      <Content
        flex
        fullWidth
        alignItems={'center'}
        justifyContent={'space-between'}
        className={'border-bottom drag-handle'}
        style={{
          padding: '8px',
          cursor: 'grab'
        }}
      >
        {dueState.inDues.length > 1 && (
          <Content flex alignItems={'center'} gap={8}>
            <Icon
              tooltip={'Previous card'}
              className={ClassName.flatButton(4, '4px')}
              size={18}
              name={'park-left'}
              onClick={() => handleNavigate('prev')}
            />
            <Icon
              tooltip={'Next card'}
              className={ClassName.flatButton(4, '4px')}
              size={18}
              name={'park-right'}
              onClick={() => handleNavigate('next')}
            />
          </Content>
        )}
        <div className={'transparent-font font-size-13'} style={{ flexGrow: 1, textAlign: 'center' }}>
          {currCard && dueState.inDues.length > 0 && (
            <>
              {t('general.Last study at', {
                date: DateFormat.formatDistanceToNowStrict(currCard.last_review.getTime(), true),
                state: t(`general.${upperFirst(currCard.last_rate)}`)
              })}
            </>
          )}
        </div>
        <Content flex gap={8} alignItems={'center'}>
          <Icon
            size={18}
            tooltip={t('general.View original in group')}
            name={'park-back-one'}
            onClick={() => {
              currMeta && instance.bodyOps?.scrollToMeta?.(currMeta.id, true)
            }}
            className={ClassName.flatButton(4, '4px')}
          />
          <Icon
            name={'park-info'}
            size={18}
            tooltip={t('general.View details')}
            onClick={() => {
              currMeta && GlobalInstance.metaOps?.openDetails(currMeta.id)
            }}
            className={ClassName.flatButton(4, '4px')}
          />
          <IconWithPopover
            size={18}
            tooltip={t('general.Card list')}
            className={ClassName.flatButton(4, '4px')}
            name={'park-view-list'}
            placement={['bottom']}
            content={
              <WithBorder style={{ minWidth: 200 }} padding={6}>
                <NeedReview
                  onChange={i => {
                    setPanelState(s => ({ ...s, currentMetaId: i }))
                  }}
                  inDues={dueState.inDues}
                  list
                />
              </WithBorder>
            }
          ></IconWithPopover>
          <Icon
            size={18}
            name={'park-close'}
            onClick={() => setPanelState(s => ({ ...s, visible: false }))}
            className={ClassName.flatButton(4, '4px')}
          />
        </Content>
      </Content>
      {dueState.inDues.length ? (
        <ReviewContent
          metaId={panelState.currentMetaId}
          onReview={() => {
            handleReview()
          }}
        />
      ) : (
        <ReviewCongradulation onBack={() => setPanelState(s => ({ ...s, mode: 'main' }))} />
      )}
    </ResizeAndDrag>
  )
  if (panelState.visible) {
    return createPortal(panelState.mode === 'main' ? renderMain() : renderReview(), document.body)
  }
})
