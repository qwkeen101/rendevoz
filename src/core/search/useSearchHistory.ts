import KeyvalueStore from '@/api/stores/keyvalue.store'

export default () => {
  const workspace = KeyvalueStore.useValue('currentWorkspace')
  const history = KeyvalueStore.useValue('searchQueryHistory')
  const state = workspace ? history?.[workspace.id] ?? [] : []
  const updateHistory = (updater: (curr: typeof state) => typeof state) => {
    if (workspace) {
      KeyvalueStore.updateOne('searchQueryHistory', {
        ...history,
        [workspace.id]: updater(state)
      })
    }
  }
  return {
    history: state,
    updateHistory
  }
}
