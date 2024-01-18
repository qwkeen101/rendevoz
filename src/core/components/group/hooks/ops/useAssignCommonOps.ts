import { IGroupInstance, MetaGroup } from '~/typings'
import { assignProperties } from '@/utils'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Rendevoz } from '@/core/rendevoz'
import produce from 'immer'
import { useSetAtom, useStore } from 'jotai'

export default (instance: IGroupInstance, groupValue?: MetaGroup) => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const store = useStore()
  assignProperties(instance, {
    openObject: (id, rowId) => {
      const groupState = store.get(GroupStateAtom)
      if (!groupState.data?.openIn || groupState.data.openIn === 'newTab') {
        Rendevoz.Actions.Open.Meta.openMetaObject(id)
      }
      if (groupState.data?.openIn === 'center') {
        instance.centerOps?.open(id, rowId)
      }
      if (groupState.data?.openIn === 'sidePeek') {
        instance.sidebarOps?.open({ type: 'preview', metaId: id, rowId })
      }
    },
    deleteView: viewId => {
      const groupState = store.get(GroupStateAtom)
      const isCurrent = viewId === groupState.currentView?.id
      if (groupValue) {
        const prevView = Math.max(0, groupValue?.views.findIndex(i => i.id === viewId) - 1)
        const afterViews = groupValue.views.filter(i => i.id !== viewId)
        instance.updateGroupData?.(s => ({ ...s, views: afterViews, lastViewId: isCurrent ? afterViews[prevView]?.id : s.lastViewId }))
      }
    },
    getCurrentView: () => {
      return store.get(GroupStateAtom).currentView
    },
    getGroupData: () => {
      return store.get(GroupStateAtom).data
    },
    updateCurrentView: updater => {
      const groupState = store.get(GroupStateAtom)
      const groupValue = groupState.data
      if (groupState.currentView && groupValue) {
        const newCurrentView = updater(groupState.currentView)
        setGroupState(s => ({ ...s, currentView: newCurrentView }))
        const newData = produce(groupValue, draft => {
          const index = draft.views.findIndex(i => i.id === newCurrentView.id)
          if (index >= 0) {
            draft.views[index] = newCurrentView
          }
        })
        instance.updateGroupData?.(() => ({ ...newData }))
      }
    }
  })
}
