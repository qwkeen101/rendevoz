import KeyvalueStore, { INewsData } from '@/api/stores/keyvalue.store'

const defaultData: INewsData = {
}

const useNewsData = () => {
  return KeyvalueStore.useValue('googleNewsData') || defaultData
}

const getData = () => {
  return KeyvalueStore.getOne('googleNewsData') || defaultData
}

const updateData = async (updater: (curr: INewsData) => INewsData) => {
  const curr = getData()
  await KeyvalueStore.updateOne('googleNewsData', updater(curr))
}

const getSearchLanguage = () => {
  const data = getData()
  return {
    region: data.region ?? 'us',
    language: data.language ?? 'en'
  }
}

useNewsData.getData = getData
useNewsData.updateData = updateData
useNewsData.getSearchLanguage = getSearchLanguage
export default useNewsData as typeof useNewsData & {
  getData: typeof getData
  updateData: typeof updateData
  getSearchLanguage: typeof getSearchLanguage
}
