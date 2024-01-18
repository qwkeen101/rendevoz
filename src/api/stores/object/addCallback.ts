import { ObjectFamily } from '@/api/stores/object/object.store'
import { GlobalInstance } from '@/hooks'
import { getSetting } from '@/core'
import { MetaStore } from '@/api/stores'

export default (o: ObjectFamily[keyof ObjectFamily]) => {
  if (GlobalInstance.objectOps?.isLabel(o)) {
    if (!('id' in o) || !('specType' in o)) return
    const setting = getSetting()
    if (setting.label.autoAddAsObject) {
      GlobalInstance.metaOps?.addDraggableAsMeta({
        type: o.specType,
        labelId: o.id
      })
    }
  }
}
