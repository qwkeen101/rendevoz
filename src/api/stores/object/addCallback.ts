import { ObjectFamily } from '@/api/stores/object/object.store'
import { GlobalInstance } from '@/hooks'
import { getSetting } from '@/core'

export default (o: ObjectFamily[keyof ObjectFamily]) => {
  if (GlobalInstance.objectOps?.isLabel(o)) {
    if (!('id' in o) || !('specType' in o)) return
    const setting = getSetting()
    GlobalInstance.metaOps?.addDraggableAsMeta(
      {
        type: o.specType,
        labelId: o.id
      },
      setting.label.autoAddAsObject ? false : true
    )
  }
}
