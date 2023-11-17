import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async (itemId: number) => {
  const currentReadLaters = (await KeyvalueStore.getOne('feedReadLaterIds')) || []
  await KeyvalueStore.updateOne(
    'feedReadLaterIds',
    currentReadLaters.filter(i => i !== itemId)
  )
}
