import KeyvalueStore from '@/api/stores/keyvalue.store'

export default (feedItemId: number) => {
  const allReadIds = KeyvalueStore.useValue('feedReadIds') || []
  const isRead = allReadIds.includes(feedItemId)
  return isRead
}
