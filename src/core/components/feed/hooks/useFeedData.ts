import KeyvalueStore, { IFeedData } from '@/api/stores/keyvalue.store'

const defaultData: IFeedData = {
  history: [],
  cardView: 'magazine',
  libraryCache: {},
  followedItems: []
}

const useFeedData = () => {
  return KeyvalueStore.useValue('feedData') || defaultData
}

const getData = () => {
  return KeyvalueStore.getOne('feedData') || defaultData
}
const updateData = async (updater: (curr: IFeedData) => IFeedData) => {
  const curr = getData()
  await KeyvalueStore.updateOne('feedData', updater(curr))
}
const addFeedToHistory = async (id: number) => {
  updateData(curr => ({
    ...curr,
    history: [{ id, date: Date.now() }, ...curr.history.filter(i => i.id !== id)]
  }))
}
useFeedData.getData = getData
useFeedData.updateData = updateData
useFeedData.addFeedToHistory = addFeedToHistory
export default useFeedData as typeof useFeedData & {
  getData: typeof getData
  updateData: typeof updateData
  addFeedToHistory: typeof addFeedToHistory
}
