import KeyvalueStore from '@/stores/keyvalue.store'

export default async (feedItemId: number) => {
  const currentReadlaters = (await KeyvalueStore.getOne('feedReadLaterIds')) || []
  await KeyvalueStore.updateOne('feedReadLaterIds', [feedItemId, ...currentReadlaters])
}
