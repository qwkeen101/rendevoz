import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import useGroupState from '@/core/group/hooks/useGroupState'
import { GlobalInstance } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'
import { ObjectStore } from '@/api/stores'
import produce from 'immer'

export default (instance: IGroupInstance, groupId: number) => {
  const [groupState, setGroupState] = useGroupState()
  const groupData = ObjectStore('group').useValue(groupId)
  assignProperties(instance, {
    openObject: id => {
      if (!groupState.data?.openIn || groupState.data.openIn === 'newTab') {
        Rendevoz.Actions.Open.Meta.openMetaObject(id)
      }
      if (groupState.data?.openIn === 'center') {
        GlobalInstance.metaOps?.preview(id)
      }
      if (groupState.data?.openIn === 'sidePeek') {
        instance.sidebarOps?.open({ type: 'preview', metaId: id })
      }
    },
    deleteView: viewId => {
      const isCurrent = viewId === groupState.currentView?.id
      if (groupData) {
        const prevView = Math.max(0, groupData?.views.findIndex(i => i.id === viewId) - 1)
        const afterViews = groupData.views.filter(i => i.id !== viewId)
        instance.updateGroupData?.(s => ({ ...s, views: afterViews, lastViewId: isCurrent ? afterViews[prevView]?.id : s.lastViewId }))
      }
    },
    updateCurrentView: updater => {
      if (groupState.currentView && groupData) {
        const newCurrentView = updater(groupState.currentView)
        setGroupState(s => ({ ...s, currentView: newCurrentView }))
        const newData = produce(groupData, draft => {
          const index = draft.views.findIndex(i => i.id === newCurrentView.id)
          if (index >= 0) {
            draft.views[index] = newCurrentView
          }
        })
        ObjectStore('group').updateOne({ ...newData })
      }
    }
  })
}
