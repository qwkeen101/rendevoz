import { GlobalInstances } from '~/typings'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'
import { GlobalDragOverlayInstance } from '../global'

const translate: GlobalInstances.TranslateInstance['translate'] = async opts => {
  GlobalTranslateInstance.translate?.(opts)
}
const startDrag: GlobalInstances.DragDropInstance['startDrag'] = () => {
  GlobalDragOverlayInstance.startDrag?.()
}
const endDrag: GlobalInstances.DragDropInstance['endDrag'] = () => {
  GlobalDragOverlayInstance.endDrag?.()
}

const setDraggingDetails: GlobalInstances.DragDropInstance['setDraggingDetails'] = details => {
  GlobalDragOverlayInstance.setDraggingDetails?.(details)
}

const addDragElements: GlobalInstances.DragDropInstance['addDragElements'] = eles => {
  GlobalDragOverlayInstance.addDragElements?.(eles)
}

const getDraggingDetails: GlobalInstances.DragDropInstance['getDraggingDetails'] = () => {
  return GlobalDragOverlayInstance.getDraggingDetails?.()
}

const State = {
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
