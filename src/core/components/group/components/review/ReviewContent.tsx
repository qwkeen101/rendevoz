import { memo, useEffect, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { Colors } from '@/consts'
import { getScheduling, initializeReviewCard, reviewCard, ReviewStateType } from '@/core/review/fsrs'
import { Button, Content } from '@/components'
import { ClassName } from 'rendevoz'
import { formatDistanceStrict } from 'date-fns'
import { DateFormat } from '@/utils'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import { useTranslation } from 'react-i18next'

export default memo(({ metaId, onReview }: { metaId?: number; onReview: () => void }) => {
  const { t } = useTranslation()
  const reviewOptions = [
    // {
    //   type: 'skip',
    //   text: 'Skip',
    //   time: '1 hour',
    //   bg: Colors.getAdaptColor('#ddd', 55)
    // },
    {
      type: 'again',
      text: t('general.Again'),
      bg: Colors.getAdaptColor('#ffb7bb', 55)
    },
    {
      type: 'hard',
      text: t('general.Hard'),
      bg: Colors.getAdaptColor('#ffd5ae', 55)
    },
    {
      type: 'good',
      text: t('general.Good'),
      bg: Colors.getAdaptColor('#c1dbff', 55)
    },
    {
      type: 'easy',
      text: t('general.Easy'),
      bg: Colors.getAdaptColor('#a8e2b4', 50)
    }
  ]
  const currMeta = MetaStore.useValue(metaId)
  const currentCard = ObjectStore('reviewCard').useValue(currMeta?.review || 0)
  const [dues, setDues] = useState<Record<ReviewStateType, Date>>({})
  const handleReview = async (type: ReviewStateType) => {
    onReview(type)
    if (currMeta) {
      if (!currMeta.review) {
        const initialized = initializeReviewCard(type)
        const card = await ObjectStore('reviewCard').addOne({ ...initialized, metaId: currMeta.id })
        await MetaStore.updateMetaObject({ id: currMeta.id, review: card.id })
      } else {
        const card = await ObjectStore('reviewCard').getOneById(currMeta.review)
        if (!card) {
          const initialized = initializeReviewCard(type)
          await ObjectStore('reviewCard').addOne({ ...initialized, metaId: currMeta.id })
        } else {
          const reviewed = reviewCard(card, type)
          await ObjectStore('reviewCard').updateOne({ id: card.id, metaId: currMeta.id, ...reviewed })
        }
      }
    }
  }
  const handleRelearn = async (type: 'forgot' | 'remembered') => {
    if (type === 'remembered') {
      if (currentCard) {
        await ObjectStore('reviewCard').updateOne({ ...currentCard, last_review: new Date() })
      }
      onReview?.()
    }
    if (type === 'forgot') {
      onReview?.()
      if (currentCard) {
        const reviewed = reviewCard(currentCard, 'again')
        await ObjectStore('reviewCard').updateOne({ ...currentCard, ...reviewed, last_rate: 'again', due: new Date() })
      }
    }
  }
  useEffect(() => {
    if (currMeta) {
      if (currMeta.review) {
        ObjectStore('reviewCard')
          .getOneById(currMeta.review)
          .then(c => {
            setDues(getScheduling(c))
          })
      } else {
        setDues(getScheduling())
      }
    }
  }, [currMeta])
  if (!metaId) {
    return null
  }
  const m = MetaStore.getCachedMetaObject(metaId)
  const renderOptions = () => {
    if (currentCard) {
      if (currentCard.due.getTime() > Date.now())
        return (
          <Content
            className={'border-top'}
            flex
            alignItems={'center'}
            justifyContent={'center'}
            gap={16}
            style={{
              padding: 16,
              flexShrink: 0
            }}
          >
            <Content
              style={{
                flex: 1,
                borderRadius: 6,
                background: Colors.getAdaptColor('#ffb7bb', 55),
                cursor: 'pointer'
              }}
            >
              <Content
                flex
                column
                gap={3}
                alignItems={'center'}
                onClick={() => handleRelearn('forgot')}
                className={ClassName.flatButton()}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 6
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 15 }}>{t('general.Forgot')}</div>
              </Content>
            </Content>
            <Content
              style={{
                flex: 1,
                borderRadius: 6,
                background: Colors.getAdaptColor('#a8e2b4', 50),
                cursor: 'pointer'
              }}
            >
              <Content
                flex
                onClick={() => handleRelearn('remembered')}
                column
                gap={3}
                alignItems={'center'}
                className={ClassName.flatButton()}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 6
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 15 }}>{t('general.Remembered')}</div>
              </Content>
            </Content>
            {/*You have finished studying this card at*/}
            {/*{DateFormat.format(currentCard.last_review, DateFormat.Formats.withMinute)}*/}
          </Content>
        )
    }
    return (
      <Content className={'border-top'} flex justifyContent={'center'} style={{ padding: '16px', flexShrink: 0 }} gap={12}>
        {reviewOptions.map(i => (
          <Content
            key={i.text}
            style={{
              flex: 1,
              borderRadius: 6,
              background: i.bg,
              cursor: 'pointer'
            }}
            onClick={() => {
              handleReview(i.type)
            }}
          >
            <Content
              flex
              column
              gap={3}
              alignItems={'center'}
              className={ClassName.flatButton()}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 15 }}>{i.text}</div>
              {dues?.[i.type] && (
                <div className={'font-size-12 transparent-font'}>{DateFormat.formatDistanceToNowStrict(dues?.[i.type])}</div>
              )}
            </Content>
          </Content>
        ))}
      </Content>
    )
  }
  if (m) {
    const content = Rendevoz.Actions.Layout.getRegisteredTabContent(m.type)
    if (content) {
      return (
        <>
          <div style={{ width: '100%', flex: 'auto', position: 'relative', height: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            <DockTabPaneContext.Provider value={{ currentTabId: 0 }} key={m.id}>
              {content({
                objectId: m.objectId,
                type: m.type,
                metaId: m.id
              })}
            </DockTabPaneContext.Provider>
          </div>
          {renderOptions()}
        </>
      )
    }
  }
  return null
})
