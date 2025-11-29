import { ObjectStore } from '@/api/stores'
import { AI_SUMMARY_PROP_ID, REVIEW_STATE_PROP_ID } from '@/api/stores/meta/meta.store'

export default async () => {
  const reviewStateProp = await ObjectStore('metaProp').getOneById(REVIEW_STATE_PROP_ID)
  if (reviewStateProp) {
    if (reviewStateProp.propType !== 'singleSelect') {
      await ObjectStore('metaProp').updateOne({ id: REVIEW_STATE_PROP_ID, propType: 'singleSelect' })
    }
  }
  const aiSummaryProp = await ObjectStore('metaProp').getOneById(AI_SUMMARY_PROP_ID)
  if (aiSummaryProp) {
    if (aiSummaryProp.propType !== 'string') {
      await ObjectStore('metaProp').updateOne({ id: AI_SUMMARY_PROP_ID, propType: 'string' })
    }
  }
}
