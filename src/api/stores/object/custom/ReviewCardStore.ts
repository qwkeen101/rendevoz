import createObjectStore from '@/api/stores/object/object.store'
import { MetaStore, ObjectStore } from '@/api/stores'
import { REVIEW_STATE_PROP_ID, REVIEW_STATUS_PROP_ID } from '@/api/stores/meta/meta.store'
import { IReviewCard, IReviewDue, IReviewStateType } from '~/typings'
import { t } from 'i18next'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import produce from 'immer'
import { State } from 'ts-fsrs'
export const AGAIN_OPTION_ID = 1100
export const EASY_OPTION_ID = 1101
export const HARD_OPTION_ID = 1102
export const GOOD_OPTION_ID = 1103
export const NEW_STATUS_ID = 1201
export const LEARNING_STATUS_ID = 1202
export const REVIEW_STATUS_ID = 1203
export const RELEARNING_STATUS_ID = 1204

export default function createReviewStore() {
  const handleUpdateMeta = async (v: IReviewCard) => {
    if (v.metaId) {
      const stateProp = await ObjectStore('metaProp').getOneById(REVIEW_STATE_PROP_ID)
      if (!stateProp) {
        await ObjectStore('metaProp').addOne({
          id: REVIEW_STATE_PROP_ID,
          propType: 'singleSelect',
          icon: 'park-star',
          name: t('general.Study rating')
        })
      }
      const statusProp = await ObjectStore('metaProp').getOneById(REVIEW_STATUS_PROP_ID)
      if (!statusProp) {
        await ObjectStore('metaProp').addOne({
          id: REVIEW_STATUS_PROP_ID,
          propType: 'singleSelect',
          icon: 'park-check-one',
          name: t('review.Status')
        })
      }
      addReviewOption(AGAIN_OPTION_ID, 'again')
      addReviewOption(HARD_OPTION_ID, 'hard')
      addReviewOption(GOOD_OPTION_ID, 'good')
      addReviewOption(EASY_OPTION_ID, 'easy')
      addReviewStatus(NEW_STATUS_ID, 'new')
      addReviewStatus(LEARNING_STATUS_ID, 'learning')
      addReviewStatus(REVIEW_STATUS_ID, 'review')
      addReviewStatus(RELEARNING_STATUS_ID, 'relearning')
      if (v.last_rate) {
        switch (v.last_rate) {
          case 'hard':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: HARD_OPTION_ID
            })
            break
          case 'easy':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: EASY_OPTION_ID
            })
            break
          case 'good':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: GOOD_OPTION_ID
            })
            break
          case 'again':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: AGAIN_OPTION_ID
            })
            break
        }
        switch (v.state) {
          case State.New: {
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATUS_PROP_ID, {
              value: NEW_STATUS_ID
            })
            break
          }
          case State.Review: {
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATUS_PROP_ID, {
              value: REVIEW_STATUS_ID
            })
            break
          }
          case State.Relearning: {
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATUS_PROP_ID, {
              value: RELEARNING_STATUS_ID
            })
            break
          }
          case State.Learning: {
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATUS_PROP_ID, {
              value: LEARNING_STATUS_ID
            })
            break
          }
        }
      } else {
        const m = MetaStore.getCachedMetaObject(v.metaId)
        if (m?.properties[REVIEW_STATE_PROP_ID] || m?.properties[REVIEW_STATUS_PROP_ID]) {
          MetaStore.updateMetaObject({
            id: m.id,
            properties: produce(m.properties!, draft => {
              delete draft[REVIEW_STATUS_PROP_ID]
              delete draft[REVIEW_STATE_PROP_ID]
            })
          })
        }
      }
    }
  }
  return createObjectStore('reviewCard', {
    afterAddProcess: {
      onSuccess: v => {
        handleUpdateMeta(v)
      }
    },
    afterDeleteProcess: async o => {
      if (o.metaId) {
        const m = MetaStore.getCachedMetaObject(o.metaId)
        if (!m) return
        if (m.review || m.properties[REVIEW_STATE_PROP_ID] || m.properties[REVIEW_STATUS_PROP_ID]) {
          await MetaStore.updateMetaObject({
            id: m.id,
            review: undefined,
            properties: produce(m.properties, draft => {
              delete draft[REVIEW_STATUS_PROP_ID]
              delete draft[REVIEW_STATE_PROP_ID]
            })
          })
        }
      }
    },
    afterUpdateProcess: {
      onSuccess: obj => {
        handleUpdateMeta(obj)
      }
    }
  })
}

const addReviewOption = async (id: number, name: IReviewStateType) => {
  const existed = await ObjectStore('metaPropSelectOption').getOneById(id)
  if (!existed) {
    await ObjectStore('metaPropSelectOption').addOne({
      id: id,
      parentPropName: `${REVIEW_STATE_PROP_ID}`,
      color: ReviewConsts.colors[name],
      name: t(ReviewConsts.trans[name])
    })
  }
}
const addReviewStatus = async (id: number, name: IReviewDue) => {
  const existed = await ObjectStore('metaPropSelectOption').getOneById(id)
  if (!existed) {
    await ObjectStore('metaPropSelectOption').addOne({
      id: id,
      parentPropName: `${REVIEW_STATUS_PROP_ID}`,
      color: ReviewConsts.colors[name],
      name: t(ReviewConsts.trans[name])
    })
  }
}
