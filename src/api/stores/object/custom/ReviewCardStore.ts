import createObjectStore from '@/api/stores/object/object.store'
import { MetaStore, ObjectStore } from '@/api/stores'
import { REVIEW_STATE_PROP_ID } from '@/api/stores/meta/meta.store'
import { IReviewCard } from '~/typings'
import { t } from 'i18next'
export const AGAIN_OPTION_ID = 1100
export const EASY_OPTION_ID = 1101
export const HARD_OPTION_ID = 1102
export const GOOD_OPTION_ID = 1103
export default function createReviewStore() {
  const handleUpdateMeta = async (v: IReviewCard) => {
    if (v.metaId) {
      const prop = await ObjectStore('metaProp').getOneById(REVIEW_STATE_PROP_ID)
      if (!prop) {
        await ObjectStore('metaProp').addOne({
          id: REVIEW_STATE_PROP_ID,
          propType: 'reviewState',
          icon: 'park-tips',
          name: t('general.Study state')
        })
      }
      !(await ObjectStore('metaPropSelectOption').getOneById(AGAIN_OPTION_ID)) &&
        (await ObjectStore('metaPropSelectOption').addOne({
          id: AGAIN_OPTION_ID,
          parentPropName: `${REVIEW_STATE_PROP_ID}`,
          color: '#ffb7bb',
          name: t('general.Again')
        }))
      !(await ObjectStore('metaPropSelectOption').getOneById(HARD_OPTION_ID)) &&
        (await ObjectStore('metaPropSelectOption').addOne({
          id: HARD_OPTION_ID,
          parentPropName: `${REVIEW_STATE_PROP_ID}`,
          color: '#ffd5ae',
          name: t('general.Hard')
        }))
      !(await ObjectStore('metaPropSelectOption').getOneById(EASY_OPTION_ID)) &&
        (await ObjectStore('metaPropSelectOption').addOne({
          id: EASY_OPTION_ID,
          parentPropName: `${REVIEW_STATE_PROP_ID}`,
          color: '#a8e2b4',
          name: t('general.Easy')
        }))
      !(await ObjectStore('metaPropSelectOption').getOneById(GOOD_OPTION_ID)) &&
        (await ObjectStore('metaPropSelectOption').addOne({
          id: GOOD_OPTION_ID,
          parentPropName: `${REVIEW_STATE_PROP_ID}`,
          color: '#c1dbff',
          name: t('general.Good')
        }))
      if (v.last_rate) {
        switch (v.last_rate) {
          case 'hard':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: HARD_OPTION_ID
            })
            return
          case 'easy':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: EASY_OPTION_ID
            })
            return
          case 'good':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: GOOD_OPTION_ID
            })
            return
          case 'again':
            await MetaStore.property.updateProperty(v.metaId, REVIEW_STATE_PROP_ID, {
              value: AGAIN_OPTION_ID
            })
            return
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
    afterUpdateProcess: {
      onSuccess: obj => {
        handleUpdateMeta(obj)
      }
    }
  })
}
