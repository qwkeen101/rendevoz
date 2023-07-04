import { State as IState } from '~/typings'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'
import { GlobalDragOverlayInstance } from '../global'

type IStateApi = typeof IState
const translate: IStateApi['Translate']['translate'] = async opts => {
  GlobalTranslateInstance.translate?.(opts)
}
const startDrag: IStateApi['Drag']['startDrag'] = () => {
  GlobalDragOverlayInstance.startDrag?.()
}
const endDrag: IStateApi['Drag']['endDrag'] = () => {
  GlobalDragOverlayInstance.endDrag?.()
}

const setDraggingDetails: IStateApi['Drag']['setDraggingDetails'] = details => {
  GlobalDragOverlayInstance.setDraggingDetails?.(details)
}

const addDragElements: IStateApi['Drag']['addDragElements'] = eles => {
  GlobalDragOverlayInstance.addDragElements?.(eles)
}

const getDraggingDetails: IStateApi['Drag']['getDraggingDetails'] = () => {
  return GlobalDragOverlayInstance.getDraggingDetails?.()
}

const State: IStateApi = {
  Translate: {
    translate
  },
  Drag: {
    startDrag,
    endDrag,
    addDragElements,
    setDraggingDetails,
    getDraggingDetails
  }
}

export default State
